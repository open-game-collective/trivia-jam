import { ActorKitStateMachine } from "actor-kit";
import { produce } from "immer";
import { assign, DoneActorEvent, fromPromise, setup } from "xstate";
import type { GameEvent, GameInput, GameServerContext, Answer, QuestionResult, Question } from "./game.types";

// Helper function to calculate scores based on answers
function calculateScores(
  answers: Answer[],
  question: Question,
  startTime: number
): QuestionResult["scores"] {
  // Filter out invalid answers
  const validAnswers = answers.filter(answer => 
    !isNaN(answer.value) && 
    isFinite(answer.value)
  );

  // Check for exact matches first
  const exactMatches = validAnswers.filter(answer => 
    answer.value === question.correctAnswer
  );

  // If we have exact matches or require exact answers, only score those
  const scoringAnswers = question.requireExactAnswer || exactMatches.length > 0
    ? exactMatches
    : validAnswers;

  // Calculate metrics for scoring answers
  const scoredAnswers = scoringAnswers.map(answer => ({
    ...answer,
    difference: Math.abs(answer.value - question.correctAnswer),
    timeTaken: (answer.timestamp - startTime) / 1000
  }));

  // Sort by difference first (for closest answer mode), then by time
  scoredAnswers.sort((a, b) => {
    if (a.difference !== b.difference) {
      return a.difference - b.difference;
    }
    return a.timeTaken - b.timeTaken;
  });

  // For closest answer mode with no exact matches, allow top 3 to score
  const scoringPositions = question.requireExactAnswer || exactMatches.length > 0
    ? Math.max(3, Math.floor(answers.length * 0.3))  // Normal scoring for exact matches
    : 3;  // Top 3 closest answers get points (3,2,1)

  // Group answers by position (handling ties)
  const positions = scoredAnswers.reduce<Array<typeof scoredAnswers>>((acc, answer) => {
    const lastGroup = acc[acc.length - 1];
    
    if (!lastGroup) {
      acc.push([answer]);
      return acc;
    }

    const lastAnswer = lastGroup[0];
    if (
      lastAnswer.difference === answer.difference &&
      Math.abs(lastAnswer.timeTaken - answer.timeTaken) < 0.1 // Tie if within 100ms
    ) {
      lastGroup.push(answer);
    } else {
      acc.push([answer]);
    }

    return acc;
  }, []);

  // Calculate points for each position group
  const pointsMap = new Map<string, number>();
  let currentPosition = 1;

  positions.forEach(group => {
    if (currentPosition > scoringPositions) {
      group.forEach(answer => pointsMap.set(answer.playerId, 0));
    } else {
      // Average points for tied positions
      const points = group.map((_, i) => 
        Math.max(0, scoringPositions - (currentPosition + i) + 1)
      );
      const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
      
      group.forEach(answer => pointsMap.set(answer.playerId, avgPoints));
    }
    currentPosition += group.length;
  });

  // Create final scores array including all players
  return answers.map(answer => {
    const scoredAnswer = scoredAnswers.find(sa => sa.playerId === answer.playerId);
    const position = scoredAnswer 
      ? positions.findIndex(group => group.some(a => a.playerId === answer.playerId)) + 1
      : positions.length + 1;

    return {
      playerId: answer.playerId,
      playerName: answer.playerName,
      points: pointsMap.get(answer.playerId) || 0,
      position,
      timeTaken: (answer.timestamp - startTime) / 1000
    };
  });
}

export const gameMachine = setup({
  types: {} as {
    context: GameServerContext;
    events: GameEvent;
    input: GameInput;
  },
  guards: {
    isHost: ({ context, event }) => event.caller.id === context.public.hostId,
    hasReachedQuestionLimit: ({ context }) => 
      context.public.questionNumber >= context.public.settings.questionCount,
  },
  actors: {
    generateGameCode: fromPromise(async () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += characters[Math.floor(Math.random() * characters.length)];
      }
      return code;
    }),
    answerTimer: fromPromise(async ({ input }: { input: { timeWindow: number } }) => {
      const { timeWindow } = input;
      await new Promise(resolve => setTimeout(resolve, timeWindow * 1000));
      return true;
    }),
  },
  actions: {
    updateGameStatus: assign(
      (
        { context },
        { status }: { status: "lobby" | "active" | "finished" }
      ) => ({
        public: produce(context.public, (draft) => {
          draft.gameStatus = status;
        }),
      })
    ),
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
      (
        { context },
        { question }: { question: { text: string; correctAnswer: number; requireExactAnswer: boolean } }
      ) => ({
        public: produce(context.public, (draft) => {
          draft.currentQuestion = {
            questionId: crypto.randomUUID(),
            startTime: Date.now(),
            answers: [],
          };
          draft.questions[draft.currentQuestion.questionId] = {
            id: draft.currentQuestion.questionId,
            text: question.text,
            correctAnswer: question.correctAnswer,
            requireExactAnswer: question.requireExactAnswer,
          };
        }),
      })
    ),
    addToBuzzerQueue: assign(
      ({
        context,
        event,
      }: {
        context: GameServerContext;
        event: GameEvent;
      }) => ({
        public: produce(context.public, (draft) => {
          // draft.buzzerQueue.push(event.caller.id);
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
              // draft.buzzerQueue = [];
            } else {
              // draft.buzzerQueue = draft.buzzerQueue.slice(1);
              // draft.previousAnswers = draft.previousAnswers || [];
              // draft.previousAnswers.push({
              //   playerId: player.id,
              //   playerName: player.name,
              //   correct: false,
              // });
            }

            // draft.lastAnswerResult = {
            //   playerId: player.id,
            //   playerName: player.name,
            //   correct,
            // };

            if (draft.questionNumber > draft.settings.questionCount) {
              draft.gameStatus = "finished";
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
    setGameCode: assign(({ context }, { code }: { code: string }) => ({
      public: produce(context.public, (draft) => {
        draft.gameCode = code;
      }),
    })),
    assignGeneratedGameCode: assign(
      ({ context }, { gameCode }: { gameCode: string }) => ({
        public: produce(context.public, (draft) => {
          draft.gameCode = gameCode;
        }),
      })
    ),
    skipQuestion: assign(({ context }) => ({
      public: produce(context.public, (draft) => {
        draft.currentQuestion = null;
        // draft.buzzerQueue = [];
        draft.questionNumber += 1;

        if (draft.questionNumber > draft.settings.questionCount) {
          draft.gameStatus = "finished";
          draft.winner = draft.players.reduce((a, b) =>
            a.score > b.score ? a : b
          ).id;
        }
      }),
    })),
    removePlayer: assign(({ context }, { playerId }: { playerId: string }) => ({
      public: produce(context.public, (draft) => {
        draft.players = draft.players.filter((p) => p.id !== playerId);
        // draft.buzzerQueue = draft.buzzerQueue.filter(id => id !== playerId);
        // if (draft.previousAnswers) {
        //   draft.previousAnswers = draft.previousAnswers.filter(a => a.playerId !== playerId);
        // }
      }),
    })),
    submitAnswer: assign(({ context, event }) => ({
      public: produce(context.public, (draft) => {
        if (draft.currentQuestion && event.type === "SUBMIT_ANSWER") {
          draft.currentQuestion.answers.push({
            playerId: event.caller.id,
            playerName: draft.players.find(p => p.id === event.caller.id)?.name || "Unknown",
            value: event.value,
            timestamp: Date.now()
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
          scores
        };

        // Update player scores
        scores.forEach(score => {
          const player = draft.players.find(p => p.id === score.playerId);
          if (player) {
            player.score += Math.round(score.points);
          }
        });

        // Add to question results history
        draft.questionResults.push(questionResult);

        // Clear current question and increment counter
        draft.currentQuestion = null;
        draft.questionNumber += 1;

        // Check if game should end
        if (draft.questionNumber > draft.settings.questionCount) {
          draft.gameStatus = "finished";
          const maxScore = Math.max(...draft.players.map(p => p.score));
          const winners = draft.players.filter(p => p.score === maxScore);
          draft.winner = winners[0].id;
        }
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
      gameCode: undefined,
      players: [],
      currentQuestion: null,
      buzzerQueue: [],
      gameStatus: "lobby" as const,
      winner: null,
      settings: {
        maxPlayers: 10,
        questionCount: 50,
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
      initial: "generatingCode",
      states: {
        generatingCode: {
          invoke: {
            src: "generateGameCode",
            onDone: {
              target: "ready",
              actions: {
                type: "assignGeneratedGameCode",
                params: ({ event }: { event: DoneActorEvent<string> }) => ({
                  gameCode: event.output,
                }),
              },
            },
          },
        },
        ready: {
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
            START_GAME: {
              guard: "isHost",
              target: "#triviaGame.active",
              actions: [
                { type: "updateGameStatus", params: { status: "active" } },
                { type: "setQuestionNumber", params: { number: 1 } },
              ],
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
      },
    },
    active: {
      initial: "questionPrep",
      states: {
        questionPrep: {
          on: {
            SUBMIT_QUESTION: {
              guard: "isHost",
              target: "questionActive",
              actions: {
                type: "setQuestion",
                params: ({
                  event,
                }: {
                  event: Extract<GameEvent, { type: "SUBMIT_QUESTION" }>;
                }) => ({
                  question: {
                    text: event.text,
                    correctAnswer: event.correctAnswer,
                    requireExactAnswer: event.requireExactAnswer,
                  },
                }),
              },
            },
          },
        },
        questionActive: {
          entry: [
            // assign(({ context }: { context: GameServerContext }) => ({
            //   public: produce(context.public, (draft) => {
            //     if (draft.currentQuestion) {
            //       draft.currentQuestion.startTime = Date.now();
            //     }
            //   }),
            // })),
          ],
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
            SUBMIT_ANSWER: {
              actions: "submitAnswer",
            },
            SKIP_QUESTION: {
              guard: "isHost",
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
          guard: "isHost",
          target: "finished",
          actions: [
            { type: "updateGameStatus", params: { status: "finished" } },
            "setWinner",
          ],
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
  gameCode: string | undefined;
  players: Player[];
  currentQuestion: {
    questionId: string;
    startTime: number;
    answers: Answer[];
  } | null;
  buzzerQueue: string[];
  gameStatus: "lobby" | "active" | "finished";
  winner: string | null;
  settings: {
    maxPlayers: number;
    questionCount: number;
    answerTimeWindow: number;
  };
  questionNumber: number;
  questions: Record<string, Question>;
  questionResults: QuestionResult[];
};
