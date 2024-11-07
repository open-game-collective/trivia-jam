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
    console.log("sessionMachine context", input);
    return {
      public: {
        userId: input.caller.id,
      },
      private: {
        [input.caller.id]: {
          gameIds: [],
        },
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
