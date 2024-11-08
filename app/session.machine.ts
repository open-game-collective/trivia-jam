import type { ActorKitStateMachine } from "actor-kit";
import { setup } from "xstate";
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
  actions: {},
  guards: {},
}).createMachine({
  id: "session",
  type: "parallel",
  context: ({ input }: { input: SessionInput }) => {
    return {
      public: {
        userId: input.caller.id,
        gameIdsByJoinCode: {}, // Map of join codes to game IDs
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
        Ready: {},
      },
    },
  },
}) satisfies ActorKitStateMachine<
  SessionEvent,
  SessionInput,
  SessionServerContext
>;

export type SessionMachine = typeof sessionMachine;
