import { createRemixStub } from "@remix-run/testing";
import type { StoryContext, StoryFn } from "@storybook/react";
import { CallerSnapshotFrom } from "actor-kit";
import React from "react";
import type { GameMachine } from "../app/game.machine";
import { SessionMachine } from "../app/session.machine";

export const defaultGameSnapshot = {
  public: {
    id: "game-123",
    hostId: "host-123",
    hostName: "Test Host",
    gameCode: "ABC123",
    players: [] as Array<{ id: string; name: string; score: number }>,
    currentQuestion: null,
    winner: null,
    settings: {
      maxPlayers: 20,
      answerTimeWindow: 30,
    },
    questions: {} as Record<
      string,
      {
        id: string;
        text: string;
        correctAnswer: string | number;
        questionType: "numeric" | "multiple-choice";
        options?: string[];
      }
    >,
    questionResults: [],
    questionNumber: 0,
  },
  private: {},
  value: { lobby: "ready" } as const,
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
