import { ActorKitStateMachine } from "actor-kit";
import { produce } from "immer";
import {
  assign,
  DoneActorEvent,
  ErrorActorEvent,
  fromPromise,
  setup,
} from "xstate";
import type {
  Answer,
  GameEvent,
  GameInput,
  GameServerContext,
  Question,
  QuestionResult,
} from "./game.types";
import { parseQuestions } from "./gemini";
import { calculateScores } from "./game/scoring";

export const gameMachine = setup({
  types: {} as {
    context: GameServerContext;
    events: GameEvent;
    input: GameInput;
  },
  guards: {
    isHost: ({
      context,
      event,
    }: {
      context: GameServerContext;
      event: GameEvent;
    }) =>
      "caller" in event &&
      event.caller.type === "client" &&
      event.caller.id === context.public.hostId,
    hasReachedQuestionLimit: ({ context }: { context: GameServerContext }) =>
      context.public.questionNumber >=
      Object.keys(context.public.questions).length,
  },
  actors: {
    answerTimer: fromPromise(
      async ({ input }: { input: { timeWindow: number } }) => {
        const { timeWindow } = input;
        await new Promise((resolve) => setTimeout(resolve, timeWindow * 1000));
        return true;
      }
    ),
    parseQuestionsDocument: fromPromise(
      async ({
        input,
        system,
      }: {
        input: { documentContent: string; env: GameEvent["env"] };
        system: any;
      }) => {
        const { documentContent, env } = input;
        const questions = await parseQuestions(documentContent, env);
        return { questions };
      }
    ),
  },
  actions: {
    setQuestionNumber: assign(
      ({ context }, { number }: { number: number }) => ({
        public: produce(context.public, (draft) => {
          draft.questionNumber = number;
        }),
      })
    ),
    addPlayerToGame: assign(
      ({ context }, { name, id }: { name: string; id: string }) => ({
        public: produce(context.public, (draft) => {
          draft.players.push({ id, name, score: 0 });
        }),
      })
    ),
    setQuestion: assign(
      ({ context }) => ({
        public: produce(context.public, (draft) => {
          const nextQuestionNumber = draft.questionNumber + 1;
          const questionId = `q${nextQuestionNumber}`;
          
          draft.currentQuestion = {
            questionId,
            startTime: Date.now(),
            answers: [],
          };
        }),
      })
    ),
    validateAnswer: assign(
      (
        { context },
        { playerId, correct }: { playerId: string; correct: boolean }
      ) => ({
        public: produce(context.public, (draft) => {
          const player = draft.players.find((p) => p.id === playerId);
          if (player) {
            if (correct) {
              player.score += 1;
              draft.questionNumber += 1;
              draft.currentQuestion = null;
            }

            if (draft.questionNumber > Object.keys(draft.questions).length) {
              draft.winner = draft.players.reduce((a, b) =>
                a.score > b.score ? a : b
              ).id;
            }
          }
        }),
      })
    ),
    setWinner: assign(({ context }) => ({
      public: produce(context.public, (draft) => {
        draft.winner = draft.players.reduce((a, b) =>
          a.score > b.score ? a : b
        ).id;
      }),
    })),
    skipQuestion: assign(({ context }) => ({
      public: produce(context.public, (draft) => {
        draft.currentQuestion = null;
        draft.questionNumber += 1;

        if (draft.questionNumber > Object.keys(draft.questions).length) {
          draft.winner = draft.players.reduce((a, b) =>
            a.score > b.score ? a : b
          ).id;
        }
      }),
    })),
    removePlayer: assign(({ context }, { playerId }: { playerId: string }) => ({
      public: produce(context.public, (draft) => {
        draft.players = draft.players.filter((p) => p.id !== playerId);
      }),
    })),
    submitAnswer: assign(({ context, event }) => ({
      public: produce(context.public, (draft) => {
        if (draft.currentQuestion && event.type === "SUBMIT_ANSWER") {
          draft.currentQuestion.answers.push({
            playerId: event.caller.id,
            playerName:
              draft.players.find((p) => p.id === event.caller.id)?.name ||
              "Unknown",
            value: event.value,
            timestamp: Date.now(),
          });
        }
      }),
    })),
    processQuestionResults: assign(({ context }) => ({
      public: produce(context.public, (draft) => {
        if (!draft.currentQuestion) return;

        const question = draft.questions[draft.currentQuestion.questionId];
        const scores = calculateScores(
          draft.currentQuestion.answers,
          question,
          draft.currentQuestion.startTime
        );

        const questionResult = {
          questionId: draft.currentQuestion.questionId,
          questionNumber: draft.questionNumber,
          answers: draft.currentQuestion.answers,
          scores,
        };

        // Update player scores
        scores.forEach((score) => {
          const player = draft.players.find((p) => p.id === score.playerId);
          if (player) {
            player.score += Math.round(score.points);
          }
        });

        // Add to question results history
        draft.questionResults.push(questionResult);

        // Clear current question and increment counter
        draft.currentQuestion = null;

        // Check if game should end
        if (draft.questionNumber >= Object.keys(draft.questions).length) {
          const maxScore = Math.max(...draft.players.map((p) => p.score));
          const winners = draft.players.filter((p) => p.score === maxScore);
          draft.winner = winners[0].id;
        }
      }),
    })),
    assignParsedQuestions: assign(
      (
        { context },
        { questions }: { questions: Record<string, Question> }
      ) => ({
        public: produce(context.public, (draft) => {
          draft.questions = questions;
        }),
      })
    ),
    setParsingError: assign(({ context }, { error }: { error: Error }) => ({
      public: produce(context.public, (draft) => {
        draft.parsingErrorMessage = error.message;
      }),
    })),
    clearParsingError: assign(({ context }) => ({
      public: produce(context.public, (draft) => {
        draft.parsingErrorMessage = undefined;
      }),
    })),
  },
}).createMachine({
  id: "triviaGame",
  context: ({ input }: { input: GameInput }) => ({
    public: {
      id: input.id,
      hostId: input.caller.id,
      hostName: input.hostName,
      players: [],
      currentQuestion: null,
      winner: null,
      settings: {
        maxPlayers: 10,
        answerTimeWindow: 25,
      },
      questionNumber: 0,
      questions: {},
      questionResults: [],
    },
    private: {},
  }),
  initial: "lobby",
  states: {
    lobby: {
      initial: "waitingForQuestions",
      states: {
        waitingForQuestions: {
          entry: "clearParsingError",
          on: {
            PARSE_QUESTIONS: {
              guard: "isHost",
              target: "parsingDocument",
            },
          },
        },
        parsingDocument: {
          invoke: {
            src: "parseQuestionsDocument",
            input: ({ event }: { event: GameEvent }) => {
              if (event.type !== "PARSE_QUESTIONS") {
                throw new Error("Invalid event type");
              }
              return {
                documentContent: event.documentContent,
                env: event.env,
              };
            },
            onDone: {
              target: "ready",
              actions: [
                "clearParsingError",
                {
                  type: "assignParsedQuestions",
                  params: ({ event }: { event: DoneActorEvent<{ questions: Record<string, Question> }> }) => ({
                    questions: event.output.questions
                  }),
                },
              ],
            },
            onError: {
              target: "waitingForQuestions",
              actions: {
                type: "setParsingError",
                params: ({ event }: { event: ErrorActorEvent<unknown, string> }) => ({
                  error: event.error as Error,
                }),
              },
            },
          },
        },
        ready: {
          entry: "clearParsingError",
          on: {
            START_GAME: {
              guard: ({ context, event }: { 
                context: GameServerContext; 
                event: GameEvent;
              }) => 
                event.caller.id === context.public.hostId && 
                Object.keys(context.public.questions).length > 0,
              target: "#triviaGame.active",
            },
            PARSE_QUESTIONS: {
              guard: "isHost",
              target: "parsingDocument",
            },
          },
        },
      },
      on: {
        JOIN_GAME: {
          actions: {
            type: "addPlayerToGame",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "JOIN_GAME" }>;
            }) => ({
              id: event.caller.id,
              name: event.playerName,
            }),
          },
        },
        REMOVE_PLAYER: {
          guard: "isHost",
          actions: {
            type: "removePlayer",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "REMOVE_PLAYER" }>;
            }) => ({
              playerId: event.playerId,
            }),
          },
        },
      },
    },
    active: {
      initial: "questionPrep",
      states: {
        questionPrep: {
          on: {
            NEXT_QUESTION: {
              guard: ({
                context,
                event,
              }: {
                context: GameServerContext;
                event: GameEvent;
              }) => event.caller.id === context.public.hostId,
              target: "questionActive",
              actions: [
                {
                  type: "setQuestion",
                  params: ({ context }: { context: GameServerContext }) => {
                    const nextQuestionNumber = context.public.questionNumber + 1;
                    const questionId = `q${nextQuestionNumber}`;
                    return {
                      question: {
                        id: questionId,
                      },
                    };
                  },
                },
                {
                  type: "setQuestionNumber",
                  params: ({ context }: { context: GameServerContext }) => ({
                    number: context.public.questionNumber + 1,
                  }),
                },
              ],
            },
          },
        },
        questionActive: {
          invoke: {
            src: "answerTimer",
            input: ({ context }: { context: GameServerContext }) => ({
              timeWindow: context.public.settings.answerTimeWindow,
            }),
            onDone: {
              target: "questionPrep",
              actions: "processQuestionResults",
            },
          },
          on: {
            SUBMIT_ANSWER: [
              {
                guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => {
                  return !!(context.public.currentQuestion && 
                    context.public.players.length > 0 &&
                    context.public.currentQuestion.answers.length + 1 === context.public.players.length);
                },
                target: "questionPrep",
                actions: ["submitAnswer", "processQuestionResults"]
              },
              {
                actions: "submitAnswer"
              }
            ],
            SKIP_QUESTION: {
              guard: ({
                context,
                event,
              }: {
                context: GameServerContext;
                event: GameEvent;
              }) => event.caller.id === context.public.hostId,
              target: "questionPrep",
              actions: "processQuestionResults",
            },
          },
        },
      },
      on: {
        JOIN_GAME: {
          actions: {
            type: "addPlayerToGame",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "JOIN_GAME" }>;
            }) => ({
              id: event.caller.id,
              name: event.playerName,
            }),
          },
        },
        END_GAME: {
          guard: ({
            context,
            event,
          }: {
            context: GameServerContext;
            event: GameEvent;
          }) => event.caller.id === context.public.hostId,
          target: "finished",
          actions: ["setWinner"],
        },
        REMOVE_PLAYER: {
          guard: ({
            context,
            event,
          }: {
            context: GameServerContext;
            event: GameEvent;
          }) => event.caller.id === context.public.hostId,
          actions: {
            type: "removePlayer",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "REMOVE_PLAYER" }>;
            }) => ({
              playerId: event.playerId,
            }),
          },
        },
      },
    },
    finished: {
      type: "final",
    },
  },
}) satisfies ActorKitStateMachine<GameEvent, GameInput, GameServerContext>;

interface Player {
  id: string;
  name: string;
  score: number;
}

export type GameMachine = typeof gameMachine;

export type GamePublicContext = {
  id: string;
  hostId: string;
  hostName: string;
  players: Player[];
  currentQuestion: {
    questionId: string;
    startTime: number;
    answers: Answer[];
  } | null;
  winner: string | null;
  settings: {
    maxPlayers: number;
    answerTimeWindow: number;
  };
  questionNumber: number;
  questions: Record<string, Question>;
  questionResults: QuestionResult[];
};
