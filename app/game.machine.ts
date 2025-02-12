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
  const validAnswers = answers.filter(answer => {
    if (question.questionType === "numeric") {
      const numericValue = Number(answer.value);
      return !isNaN(numericValue) && isFinite(numericValue);
    }
    return typeof answer.value === "string" && question.options?.includes(answer.value);
  });

  // For multiple choice, exact match is required
  if (question.questionType === "multiple-choice") {
    const correctAnswers = validAnswers.filter(answer => 
      answer.value === question.correctAnswer
    );

    // Sort by time taken
    const sortedAnswers = correctAnswers.sort((a, b) => 
      (a.timestamp - startTime) - (b.timestamp - startTime)
    );

    // Award points based on position (4 for first, 3 for second, 2 for third, 1 for all other correct answers)
    return validAnswers.map(answer => {
      const isCorrect = answer.value === question.correctAnswer;
      const position = sortedAnswers.findIndex(a => a.playerId === answer.playerId) + 1;
      let points = 0;
      
      if (isCorrect) {
        // If correct, get at least 1 point, more for being faster
        points = position <= 3 ? 5 - position : 1;
      }

      return {
        playerId: answer.playerId,
        playerName: answer.playerName,
        points,
        position: position > 0 ? position : sortedAnswers.length + 1,
        timeTaken: (answer.timestamp - startTime) / 1000
      };
    });
  }

  // For numeric questions, use closest answer scoring
  const numericAnswers = validAnswers.map(answer => {
    const numericValue = Number(answer.value);
    const correctNumericValue = Number(question.correctAnswer);
    return {
      ...answer,
      numericValue,
      difference: Math.abs(numericValue - correctNumericValue),
      timeTaken: (answer.timestamp - startTime) / 1000
    };
  });

  // Sort by difference first, then by time
  numericAnswers.sort((a, b) => {
    if (a.difference !== b.difference) {
      return a.difference - b.difference;
    }
    return a.timeTaken - b.timeTaken;
  });

  // Group answers by position (handling ties)
  const positions = numericAnswers.reduce<Array<typeof numericAnswers>>((acc, answer) => {
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

  // Calculate points for each position group (top 3 get points)
  const pointsMap = new Map<string, number>();
  let currentPosition = 1;

  positions.forEach(group => {
    if (currentPosition > 3) {
      group.forEach(answer => pointsMap.set(answer.playerId, 0));
    } else {
      // Average points for tied positions
      const points = group.map((_, i) => Math.max(0, 4 - (currentPosition + i)));
      const avgPoints = points.reduce((a, b) => a + b, 0) / points.length;
      
      group.forEach(answer => pointsMap.set(answer.playerId, avgPoints));
    }
    currentPosition += group.length;
  });

  // Create final scores array including all players
  return validAnswers.map(answer => {
    const scoredAnswer = numericAnswers.find(sa => sa.playerId === answer.playerId);
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
    isHost: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
      'caller' in event && event.caller.type === 'client' && event.caller.id === context.public.hostId,
    hasReachedQuestionLimit: ({ context }: { context: GameServerContext }) => 
      context.public.questionNumber >= Object.keys(context.public.questions).length,
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
        { question }: { question: Question }
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
            questionType: question.questionType,
            options: question.options,
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

            if (draft.questionNumber > Object.keys(draft.questions).length) {
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

        if (draft.questionNumber > Object.keys(draft.questions).length) {
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

        // Check if game should end
        if (draft.questionNumber >= Object.keys(draft.questions).length) {
          draft.gameStatus = "finished";
          const maxScore = Math.max(...draft.players.map(p => p.score));
          const winners = draft.players.filter(p => p.score === maxScore);
          draft.winner = winners[0].id;
        }
      }),
    })),
    assignParsedQuestions: assign({
      public: ({ context, event }) => {
        if (event.type !== "QUESTIONS_PARSED") return context.public;
        return produce(context.public, (draft) => {
          draft.questions = event.questions;
        });
      }
    }),
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
                params: ({ event }: { event: Extract<GameEvent, { type: "JOIN_GAME" }> }) => ({
                  id: event.caller.id,
                  name: event.playerName,
                }),
              },
            },
            START_GAME: {
              guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
                event.caller.id === context.public.hostId,
              target: "#triviaGame.active",
              actions: [
                { type: "updateGameStatus", params: { status: "active" } },
                { type: "setQuestionNumber", params: { number: 1 } },
              ],
            },
            PARSE_QUESTIONS: {
              guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
                event.caller.id === context.public.hostId,
              target: "parsingDocument",
            },
            REMOVE_PLAYER: {
              guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
                event.caller.id === context.public.hostId,
              actions: {
                type: "removePlayer",
                params: ({ event }: { event: Extract<GameEvent, { type: "REMOVE_PLAYER" }> }) => ({
                  playerId: event.playerId,
                }),
              },
            },
          },
        },
        parsingDocument: {
          on: {
            QUESTIONS_PARSED: {
              target: "ready",
              actions: "assignParsedQuestions",
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
            NEXT_QUESTION: {
              guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
                event.caller.id === context.public.hostId,
              target: "questionActive",
              actions: [
                {
                  type: "setQuestion",
                  params: ({ event }: { event: Extract<GameEvent, { type: "NEXT_QUESTION" }> }) => ({
                    question: {
                      id: crypto.randomUUID(),
                      text: event.text,
                      correctAnswer: event.correctAnswer,
                      questionType: event.questionType,
                      options: event.options,
                    } as Question,
                  }),
                },
                { 
                  type: "setQuestionNumber", 
                  params: ({ context }: { context: GameServerContext }) => ({ 
                    number: context.public.questionNumber + 1 
                  })
                }
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
            SUBMIT_ANSWER: {
              actions: "submitAnswer",
            },
            SKIP_QUESTION: {
              guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
                event.caller.id === context.public.hostId,
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
            params: ({ event }: { event: Extract<GameEvent, { type: "JOIN_GAME" }> }) => ({
              id: event.caller.id,
              name: event.playerName,
            }),
          },
        },
        END_GAME: {
          guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
            event.caller.id === context.public.hostId,
          target: "finished",
          actions: [
            { type: "updateGameStatus", params: { status: "finished" } },
            "setWinner",
          ],
        },
        REMOVE_PLAYER: {
          guard: ({ context, event }: { context: GameServerContext; event: GameEvent }) => 
            event.caller.id === context.public.hostId,
          actions: {
            type: "removePlayer",
            params: ({ event }: { event: Extract<GameEvent, { type: "REMOVE_PLAYER" }> }) => ({
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
    answerTimeWindow: number;
  };
  questionNumber: number;
  questions: Record<string, Question>;
  questionResults: QuestionResult[];
};
