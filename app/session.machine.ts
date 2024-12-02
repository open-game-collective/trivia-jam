import type { ActorKitStateMachine } from "actor-kit";
import { setup, assign } from "xstate";
import { produce } from "immer";
import type {
  SessionEvent,
  SessionInput,
  SessionServerContext,
} from "./session.types";

export const sessionMachine = setup({
  types: {
    context: {} as SessionServerContext,
    events: {} as SessionEvent,
    input: {} as SessionInput,
  },
  actions: {
    storeWalletPublicKey: assign(
      ({ context }, { publicKey }: { publicKey: string }) => ({
        public: produce(context.public, (draft) => {
          draft.walletPublicKey = publicKey;
        }),
      })
    ),
  },
  guards: {},
}).createMachine({
  id: "session",
  type: "parallel",
  context: ({ input }: { input: SessionInput }) => {
    return {
      public: {
        userId: input.caller.id,
        gameIdsByJoinCode: {},
        walletPublicKey: undefined,
      },
      private: {
        [input.caller.id]: {},
      },
    };
  },
  states: {
    Initialization: {
      initial: "Ready",
      states: {
        Ready: {
          on: {
            CONNECT_WALLET: {
              actions: {
                type: "storeWalletPublicKey",
                params: ({ event }: { event: { publicKey: string } }) => ({
                  publicKey: event.publicKey,
                }),
              },
            },
          },
        },
      },
    },
  },
}) satisfies ActorKitStateMachine<
  SessionEvent,
  SessionInput,
  SessionServerContext
>;

export type SessionMachine = typeof sessionMachine;
