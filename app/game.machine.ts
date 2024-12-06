import { ActorKitStateMachine } from "actor-kit";
import { produce } from "immer";
import { and, assign, fromPromise, setup } from "xstate";
import type { GameEvent, GameInput, GameServerContext } from "./game.types";

export const gameMachine = setup({
  types: {} as {
    context: GameServerContext;
    events: GameEvent;
    input: GameInput;
  },
  guards: {
    isHost: ({ context, event }) => event.caller.id === context.public.hostId,
    canBuzzIn: ({ context }) => !!context.public.currentQuestion,
    hasNotBuzzedYet: ({ context, event }) =>
      !context.public.buzzerQueue.includes(event.caller.id),
    hasReachedQuestionLimit: (
      { context },
      { questionNumber }: { questionNumber: number }
    ) => questionNumber > context.public.settings.questionCount,
    hasNotPaidEntryFee: ({ context, event }) =>
      !context.public.paidPlayers.includes(event.caller.id),
    hasPaidEntryFee: ({ context, event }) =>
      context.public.paidPlayers.includes(event.caller.id),
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
    setQuestion: assign(({ context }, { question }: { question: string }) => ({
      public: produce(context.public, (draft) => {
        draft.currentQuestion = {
          text: question,
        };
        draft.buzzerQueue = [];
        draft.lastAnswerResult = null;
        draft.previousAnswers = [];
      }),
    })),
    addToBuzzerQueue: assign(
      ({
        context,
        event,
      }: {
        context: GameServerContext;
        event: GameEvent;
      }) => ({
        public: produce(context.public, (draft) => {
          draft.buzzerQueue.push(event.caller.id);
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
              draft.buzzerQueue = [];
            } else {
              draft.buzzerQueue = draft.buzzerQueue.slice(1);
              draft.previousAnswers = draft.previousAnswers || [];
              draft.previousAnswers.push({
                playerId: player.id,
                playerName: player.name,
                correct: false,
              });
            }

            draft.lastAnswerResult = {
              playerId: player.id,
              playerName: player.name,
              correct,
            };

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
        draft.buzzerQueue = [];
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
        draft.buzzerQueue = draft.buzzerQueue.filter((id) => id !== playerId);
        if (draft.previousAnswers) {
          draft.previousAnswers = draft.previousAnswers.filter(
            (a) => a.playerId !== playerId
          );
        }
      }),
    })),
    initializeGameVault: assign(
      ({ context }, { vaultAddress }: { vaultAddress: string }) => ({
        public: produce(context.public, (draft) => {
          draft.gameVault = vaultAddress;
        }),
      })
    ),
    verifyEntryFee: assign(
      (
        { context },
        {
          playerId,
          transactionSignature,
        }: { playerId: string; transactionSignature: string }
      ) => ({
        public: produce(context.public, (draft) => {
          draft.paidPlayers.push(playerId);
          draft.prizePool += context.public.entryFee;
          draft.tokenTransactions[playerId] = {
            ...draft.tokenTransactions[playerId],
            entryFeeSignature: transactionSignature,
          };
        }),
      })
    ),
    distributeRewards: assign(
      (
        { context },
        {
          transactions,
        }: { transactions: Array<{ playerId: string; signature: string }> }
      ) => ({
        public: produce(context.public, (draft) => {
          transactions.forEach((tx) => {
            draft.tokenTransactions[tx.playerId] = {
              ...draft.tokenTransactions[tx.playerId],
              prizeSignature: tx.signature,
            };
          });
        }),
      })
    ),
    updatePaidPlayers: assign(
      ({ context }, { playerId }: { playerId: string }) => ({
        public: produce(context.public, (draft) => {
          draft.paidPlayers.push(playerId);
          draft.prizePool += context.public.entryFee;
        }),
      })
    ),
    setHostName: assign(({ context }, { name }: { name: string }) => ({
      public: produce(context.public, (draft) => {
        draft.hostName = name;
      }),
    })),
    updateScheduledStartTime: assign(({ context }, { time }: { time: number }) => ({
      public: produce(context.public, (draft) => {
        draft.scheduledStartTime = time;
      }),
    })),
  },
}).createMachine({
  id: "triviaGame",
  context: ({ input }: { input: GameInput }) => {
    // Get current time and clear seconds
    const now = new Date();
    now.setSeconds(0, 0);
    
    // Get minutes and round up to next 10
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 10) * 10;
    
    // Create result time
    const nextTenMinutes = new Date(now);
    nextTenMinutes.setMinutes(roundedMinutes);
    
    // If we're less than 10 minutes away, add 10 minutes
    const timeUntilNext = nextTenMinutes.getTime() - now.getTime();
    if (timeUntilNext < 10 * 60 * 1000) {
      nextTenMinutes.setMinutes(roundedMinutes + 10);
    }

    return {
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
          questionCount: 40,
        },
        questionNumber: 0,
        entryFee: 100,
        prizePool: 0,
        paidPlayers: [],
        tokenTransactions: {},
        scheduledStartTime: nextTenMinutes.getTime(),
      },
      private: {},
    };
  },
  initial: "lobby",
  states: {
    lobby: {
      initial: "waitingForHostName",
      states: {
        waitingForHostName: {
          on: {
            SET_HOST_NAME: {
              target: "initializingVault",
              actions: {
                type: "setHostName",
                params: ({
                  event,
                }: {
                  event: Extract<GameEvent, { type: "SET_HOST_NAME" }>;
                }) => ({
                  name: event.name,
                }),
              },
            },
          },
        },
        initializingVault: {
          on: {
            SUBMIT_ENTRY_FEE: {
              target: "waitingForPlayers",
              actions: {
                type: "verifyEntryFee",
                params: ({
                  event,
                }: {
                  event: Extract<GameEvent, { type: "SUBMIT_ENTRY_FEE" }>;
                }) => ({
                  transactionSignature: event.transactionSignature,
                  playerId: event.caller.id,
                }),
              },
            },
          },
        },
        waitingForPlayers: {
          on: {
            ENTRY_FEE_VERIFIED: {
              actions: {
                type: "updatePaidPlayers",
                params: ({
                  event,
                }: {
                  event: Extract<GameEvent, { type: "ENTRY_FEE_VERIFIED" }>;
                }) => ({
                  playerId: event.playerId,
                }),
              },
            },
            ENTRY_FEE_FAILED: {
              // Handle failure
            },
          },
        },
      },
    },
    active: {
      initial: "questionPrep",
      states: {
        questionPrep: {},
        questionActive: {},
        answerValidation: {},
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
        SUBMIT_QUESTION: {
          guard: "isHost",
          target: ".questionActive",
          actions: {
            type: "setQuestion",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "SUBMIT_QUESTION" }>;
            }) => ({
              question: event.question,
            }),
          },
        },
        BUZZ_IN: {
          guard: and(["canBuzzIn", "hasNotBuzzedYet"]),
          target: ".answerValidation",
          actions: "addToBuzzerQueue",
        },
        VALIDATE_ANSWER: {
          guard: "isHost",
          target: ".questionPrep",
          actions: {
            type: "validateAnswer",
            params: ({
              event,
            }: {
              event: Extract<GameEvent, { type: "VALIDATE_ANSWER" }>;
            }) => ({
              playerId: event.playerId,
              correct: event.correct,
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
        SKIP_QUESTION: {
          guard: "isHost",
          target: ".questionPrep",
          actions: "skipQuestion",
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
      initial: "distributingPrizes",
      states: {
        distributingPrizes: {
          on: {
            REWARDS_DISTRIBUTED: {
              target: "complete",
              actions: {
                type: "distributeRewards",
                params: ({
                  event,
                }: {
                  event: Extract<GameEvent, { type: "REWARDS_DISTRIBUTED" }>;
                }) => ({
                  transactions: event.transactions,
                }),
              },
            },
          },
        },
        complete: {
          type: "final",
        },
      },
    },
  },
}) satisfies ActorKitStateMachine<GameEvent, GameInput, GameServerContext>;

interface Player {
  id: string;
  name: string;
  score: number;
}

export type GameMachine = typeof gameMachine;
