import { ActorKitStateMachine } from "actor-kit";
import { produce } from "immer";
import { and, assign, DoneActorEvent, fromPromise, setup } from "xstate";
import type { GameEvent, GameInput, GameServerContext } from "./game.types";

export const gameMachine = setup({
  types: {} as {
    context: GameServerContext;
    events: GameEvent;
    input: GameInput;
  },
  guards: {
    isHost: ({ context, event }) => event.caller.id === context.public.hostId,
    canBuzzIn: ({ context }) =>
      context.public.currentQuestion?.isVisible ?? false,
    hasNotBuzzedYet: ({ context, event }) =>
      !context.public.buzzerQueue.includes(event.caller.id),
    isQuestionVisible: ({ context }) =>
      context.public.currentQuestion?.isVisible ?? false,
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
    assignGameCode: assign({
      public: ({ context }, params: { gameCode: string }) =>
        produce(context.public, (draft) => {
          draft.gameCode = params.gameCode;
        }),
    }),
    addPlayer: assign({
      public: ({ context, event }) => {
        if (event.type !== "JOIN_GAME") return context.public;
        return {
          ...context.public,
          players: [
            ...context.public.players,
            { id: event.caller.id, name: event.playerName, score: 0 },
          ],
        };
      },
    }),
    setQuestion: assign({
      public: ({ context, event }) => {
        if (event.type !== "SUBMIT_QUESTION") return context.public;
        return {
          ...context.public,
          currentQuestion: {
            text: event.question,
            isVisible: false,
          },
          buzzerQueue: [],
        };
      },
    }),
    showQuestion: assign({
      public: ({ context }) => ({
        ...context.public,
        currentQuestion: context.public.currentQuestion
          ? { ...context.public.currentQuestion, isVisible: true }
          : null,
      }),
    }),
    addToBuzzerQueue: assign({
      public: ({ context, event }) => {
        if (event.type !== "BUZZ_IN") return context.public;
        return {
          ...context.public,
          buzzerQueue: [...context.public.buzzerQueue, event.caller.id],
        };
      },
    }),
    validateAnswer: assign({
      public: ({ context, event }) => {
        if (event.type !== "VALIDATE_ANSWER") return context.public;
        const player = context.public.players.find(
          (p) => p.id === event.playerId
        );

        return {
          ...context.public,
          players: context.public.players.map((player) =>
            player.id === event.playerId
              ? { ...player, score: player.score + (event.correct ? 1 : 0) }
              : player
          ),
          buzzerQueue: event.correct ? [] : context.public.buzzerQueue.slice(1),
          currentQuestion: event.correct
            ? null
            : context.public.currentQuestion,
          lastAnswerResult: player
            ? {
                playerId: player.id,
                playerName: player.name,
                correct: event.correct,
              }
            : null,
        };
      },
    }),
    startGame: assign({
      public: ({ context }) => ({
        ...context.public,
        gameStatus: "active" as const,
      }),
    }),
    endGame: assign({
      public: ({ context }) => ({
        ...context.public,
        gameStatus: "finished" as const,
        winner: context.public.players.reduce((a: Player, b: Player) =>
          a.score > b.score ? a : b
        ).id,
      }),
    }),
    assignGeneratedGameCode: assign({
      public: ({ context, event }: { 
        context: GameServerContext; 
        event: GameEvent | DoneActorEvent<string, "generateGameCode">
      }) => {
        if (event.type === "xstate.done.actor.generateGameCode") {
          return {
            ...context.public,
            gameCode: event.output
          };
        }
        return context.public;
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
        questionCount: 10,
      },
    },
    private: {},
  }),
  initial: "lobby",
  states: {
    lobby: {
      on: {
        JOIN_GAME: {
          actions: "addPlayer",
        },
        START_GAME: {
          guard: "isHost",
          target: "active.questionPrep",
          actions: "startGame",
        },
      },
      type: "parallel",
      states: {
        GameCode: {
          initial: "Generating",
          states: {
            Generating: {
              invoke: {
                id: "generateGameCode",
                src: "generateGameCode",
                onDone: {
                  target: "Created",
                  actions: "assignGeneratedGameCode"
                },
              },
            },
            Created: {},
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
              actions: "setQuestion",
              target: "questionActive",
            },
          },
        },
        questionActive: {
          on: {
            SHOW_QUESTION: {
              guard: "isHost",
              actions: "showQuestion",
            },
            BUZZ_IN: {
              guard: and(["canBuzzIn", "hasNotBuzzedYet"]),
              actions: "addToBuzzerQueue",
              target: "answerValidation",
            },
          },
        },
        answerValidation: {
          on: {
            VALIDATE_ANSWER: {
              guard: "isHost",
              actions: "validateAnswer",
              target: "questionPrep",
            },
          },
        },
      },
      on: {
        END_GAME: {
          guard: "isHost",
          target: "finished",
          actions: "endGame",
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
