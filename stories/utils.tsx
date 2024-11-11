import { createRemixStub } from "@remix-run/testing";
import type { StoryContext, StoryFn } from "@storybook/react";
import { AnyActorKitStateMachine, CallerSnapshotFrom } from "actor-kit";
import { createActorKitContext } from "actor-kit/react";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import type { GameMachine } from "../app/game.machine";
import { SessionMachine } from "../app/session.machine";

export const defaultGameSnapshot = {
  public: {
    id: "test-game-id",
    gameCode: "TEST123",
    hostId: "host-123",
    hostName: "Test Host",
    players: [
      { id: "host-123", name: "Test Host", score: 0 },
      { id: "player-456", name: "Test Player", score: 0 },
    ],
    currentQuestion: null,
    buzzerQueue: [],
    gameStatus: "lobby" as const,
    winner: null,
    settings: {
      maxPlayers: 10,
      questionCount: 10,
    },
    questionNumber: 0,
  },
  private: {},
  value: { lobby: "ready" },
} satisfies CallerSnapshotFrom<GameMachine>;

export const defaultSessionSnapshot = {
  public: {
    userId: "test-user-id",
    gameIdsByJoinCode: {},
  },
  private: {},
  value: { Initialization: "Ready" as const },
} satisfies CallerSnapshotFrom<SessionMachine>;

interface Route {
  path: string;
  Component: React.ComponentType<any>;
}

/**
 * Configuration interface for Remix environment in Storybook stories.
 *
 * @template TLoader - Type of the loader data returned by the route
 *
 * @example
 * ```tsx
 * parameters: {
 *   remix: {
 *     initialPath: "/game/123",
 *     loaderData: { gameId: "123" },
 *     routes: [
 *       { path: "/game/:id", Component: GameView }
 *     ],
 *     userId: "user-123"
 *   }
 * }
 * ```
 */
export interface RemixParameters<TLoader> {
  remix: {
    /** Initial URL path for the story */
    initialPath: string;
    /** Mock data that would be returned by the loader */
    loaderData: TLoader;
    /** Route path pattern (e.g., "/games/:gameId") */
    routePattern?: string;
    /** Route ID for hydration (e.g., "routes/games.$gameId") */
    routeId?: string;
    /** Additional routes to register in the Remix environment */
    routes?: Route[];
    /** Mock user ID for authentication */
    userId?: string;
    /** Mock session ID */
    sessionId?: string;
    /** Mock page session ID */
    pageSessionId?: string;
  };
}

interface Route {
  path: string;
  Component: React.ComponentType<any>;
}

/**
 * Storybook decorator that creates a mock Remix environment.
 * Required for components that use Remix hooks or utilities.
 *
 * @template TLoader - Type of the loader data
 *
 * @example
 * ```tsx
 * // In your story file:
 * const meta: Meta = {
 *   decorators: [withRemix<LoaderData>()]
 * };
 *
 * // In each story:
 * export const Default: Story = {
 *   parameters: {
 *     remix: {
 *       initialPath: "/",
 *       loaderData: { someData: "value" }
 *     }
 *   }
 * };
 * ```
 */
export const withRemix = <TLoader extends Record<string, unknown>>() => {
  return (Story: StoryFn, context: StoryContext) => {
    const remixParams = context.parameters
      ?.remix as RemixParameters<TLoader>["remix"];

    if (!remixParams) {
      throw new Error(
        "Remix parameters are required. Add them to your story parameters."
      );
    }

    const RemixStub = createRemixStub(
      [
        {
          id: "root",
          path: "/",
          loader: () => remixParams.loaderData,
          Component: Story,
        },
        ...(remixParams.routes || []),
      ],
      {
        env: {} as any,
        userId: remixParams.userId || "test-user-id",
        sessionId: remixParams.sessionId || "test-session-id",
        pageSessionId: remixParams.pageSessionId || "test-page-session-id",
      }
    );

    return (
      <RemixStub
        initialEntries={[remixParams.initialPath]}
        hydrationData={{
          loaderData: {
            root: remixParams.loaderData,
          },
        }}
      />
    );
  };
};

/**
 * Configuration interface for actor-kit state machines in stories.
 * Allows configuring multiple actors with different initial states.
 *
 * @template TMachine - Type of the actor-kit state machine
 *
 * @example
 * ```tsx
 * parameters: {
 *   actorKit: {
 *     session: {
 *       "session-123": {
 *         public: { userId: "123" },
 *         private: {},
 *         value: "ready"
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface ActorKitParameters<TMachine extends AnyActorKitStateMachine> {
  actorKit: {
    [K: string]: {
      [actorId: string]: CallerSnapshotFrom<TMachine>;
    };
  };
}

/**
 * Storybook decorator that sets up actor-kit state machines.
 *
 * There are two main patterns for testing with actor-kit:
 *
 * 1. Static Stories (Use parameters.actorKit + within):
 * - Use this decorator with parameters.actorKit
 * - Use `within(canvasElement)` in play functions
 * - Good for simple stories that don't need state manipulation
 *
 * 2. Interactive Stories (Use mount + direct client):
 * - Don't use this decorator
 * - Create client manually and use mount in play function
 * - Good for stories that need to manipulate state
 *
 * @example
 * ```tsx
 * // Pattern 1: Static Story
 * export const Static: Story = {
 *   parameters: {
 *     actorKit: {
 *       session: {
 *         "session-123": { ... }
 *       }
 *     }
 *   },
 *   play: async ({ canvasElement }) => {
 *     const canvas = within(canvasElement);
 *     // Test UI state...
 *   }
 * };
 *
 * // Pattern 2: Interactive Story
 * export const Interactive: Story = {
 *   play: async ({ canvasElement, mount }) => {
 *     const client = createActorKitMockClient({...});
 *     const canvas = within(canvasElement);
 *
 *     await mount(
 *       <Context.ProviderFromClient client={client}>
 *         <Component />
 *       </Context.ProviderFromClient>
 *     );
 *
 *     // Now you can manipulate client state...
 *     client.produce((draft) => { ... });
 *   }
 * };
 * ```
 */
export const withActorKit = <TMachine extends AnyActorKitStateMachine>({
  actorType,
  context,
}: {
  actorType: string;
  context: ReturnType<typeof createActorKitContext<TMachine>>;
}) => {
  return (Story: StoryFn, storyContext: StoryContext): React.ReactElement => {
    const actorKitParams = storyContext.parameters?.actorKit as
      | ActorKitParameters<TMachine>["actorKit"]
      | undefined;

    // If no params provided, just render the story without any providers
    if (!actorKitParams?.[actorType]) {
      return <Story />;
    }

    // Create nested providers for each actor ID
    const actorSnapshots = actorKitParams[actorType];

    // Recursively nest providers
    const createNestedProviders = (
      actorIds: string[],
      index: number,
      children: React.ReactNode
    ): React.ReactElement => {
      if (index >= actorIds.length) {
        return children as React.ReactElement;
      }

      const actorId = actorIds[index];
      const snapshot = actorSnapshots[actorId];
      const client = createActorKitMockClient<TMachine>({
        initialSnapshot: snapshot,
      });

      return (
        <context.ProviderFromClient client={client}>
          {createNestedProviders(actorIds, index + 1, children)}
        </context.ProviderFromClient>
      );
    };

    return createNestedProviders(Object.keys(actorSnapshots), 0, <Story />);
  };
};

/**
 * Helper type for stories that use actor-kit state machines.
 * Combines the story type with actor-kit parameters.
 *
 * @template TMachine - Type of the actor-kit state machine
 */
export type StoryWithActorKit<TMachine extends AnyActorKitStateMachine> = {
  parameters: ActorKitParameters<TMachine>;
};
