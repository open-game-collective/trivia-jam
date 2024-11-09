/**
 * This file contains Storybook stories for the Index route component.
 * It demonstrates different states and interactions of the home page,
 * including both static and interactive scenarios.
 *
 * The stories use both Remix and actor-kit mock environments to simulate
 * the full application context.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { CallerSnapshotFrom } from "actor-kit";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import type { LoaderData } from "../app/routes/_index";
import Index from "../app/routes/_index";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import type { RemixParameters } from "./utils";
import { withActorKit, withRemix } from "./utils";

/**
 * Story type that combines both Remix and actor-kit parameters.
 * This ensures proper typing for all story configurations.
 */
type Story = StoryObj<typeof Index> & {
  parameters: RemixParameters<LoaderData> & {
    actorKit?: {
      session: {
        [actorId: string]: CallerSnapshotFrom<SessionMachine>;
      };
    };
  };
};

/**
 * Default session state used across stories.
 * Represents a fresh session with no active games.
 */
const defaultSessionSnapshot = {
  public: {
    userId: "user-123",
    gameIdsByJoinCode: {},
  },
  private: {},
  value: { Initialization: "Ready" as const },
};

/**
 * Mock game ID used consistently across stories
 */
const TEST_GAME_ID = "12345678-1234-1234-1234-123456789012";

/**
 * Story configuration that sets up the Remix and actor-kit environment
 * used by all stories in this file.
 */
const meta: Meta<typeof Index> = {
  title: "Routes/Index",
  component: Index,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    withRemix<LoaderData>(),
    withActorKit<SessionMachine>({
      actorType: "session",
      context: SessionContext,
    }),
  ],
};

export default meta;

/**
 * Default story showing the initial state of the home page.
 * Uses both Remix and actor-kit decorators for a complete environment.
 */
export const Default: Story = {
  parameters: {
    remix: {
      initialPath: "/",
      loaderData: { gameId: TEST_GAME_ID },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
      routes: [
        {
          path: "/games/:gameId",
          Component: () => <div>Game Page</div>,
        },
      ],
    },
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
    },
  },
};

/**
 * Story demonstrating the page with a pre-filled game code from URL parameters.
 * Shows how URL parameters affect the UI state.
 */
export const WithGameCode: Story = {
  parameters: {
    remix: {
      initialPath: "/?code=ABC123",
      loaderData: { gameId: TEST_GAME_ID },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
      routes: [
        {
          path: "/games/:gameId",
          Component: () => <div>Game Page</div>,
        },
      ],
    },
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gameCodeInput = canvas.getByRole("textbox", { name: "Game Code" });
    expect(gameCodeInput).toHaveValue("ABC123");
  },
};

/**
 * Story showing the mobile viewport version of the page.
 * Uses Storybook's viewport addon to simulate mobile devices.
 */
export const Mobile: Story = {
  parameters: {
    remix: {
      initialPath: "/",
      loaderData: { gameId: TEST_GAME_ID },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
      routes: [
        {
          path: "/games/:gameId",
          Component: () => <div>Game Page</div>,
        },
      ],
    },
    viewport: {
      defaultViewport: "mobile1",
    },
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
    },
  },
};

/**
 * Interactive story demonstrating the game joining flow.
 *
 * This story manually sets up the actor-kit client instead of using the decorator
 * because it needs direct access to the client for state manipulation in the
 * play function.
 *
 * The play function demonstrates:
 * 1. Setting up a fresh session
 * 2. Mounting the component with the session context
 * 3. Interacting with the UI
 * 4. Simulating backend responses by updating the client state
 * 5. Testing that the UI updates correctly
 */
export const JoinGameInteraction: Story = {
  decorators: [
    (Story) => {
      const client = createActorKitMockClient<SessionMachine>({
        initialSnapshot: defaultSessionSnapshot,
      });

      return (
        <SessionContext.ProviderFromClient client={client}>
          <Story />
        </SessionContext.ProviderFromClient>
      );
    },
  ],
  parameters: {
    remix: {
      initialPath: "/?code=ABC123",
      loaderData: { gameId: TEST_GAME_ID },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
      routes: [
        {
          path: "/games/:gameId",
          Component: () => <div>Game Page</div>,
        },
      ],
    },
  },
  play: async ({ canvasElement, mount }) => {
    // Create session client with initial state
    const sessionClient = createActorKitMockClient<SessionMachine>({
      initialSnapshot: {
        public: {
          userId: "user-123",
          gameIdsByJoinCode: {},
        },
        private: {},
        value: { Initialization: "Ready" as const },
      },
    });

    // Mount the component with the session client
    const canvas = await mount(
      <SessionContext.ProviderFromClient client={sessionClient}>
        <Index />
      </SessionContext.ProviderFromClient>
    );

    // Get the game code input and verify initial value
    const gameCodeInput = canvas.getByRole("textbox", { name: "Game Code" });
    expect(gameCodeInput).toHaveValue("ABC123");

    // Find and click the join button
    const joinButton = canvas.getByRole("button", { name: /join game/i });
    await userEvent.click(joinButton);

    // Find the loading text
    const loadingText = await canvas.findByText(/joining/i);
    expect(loadingText).toBeInTheDocument();

    // Simulate successful join
    sessionClient.produce((draft) => {
      draft.public.gameIdsByJoinCode = {
        ABC123: "game-123",
      };
    });

    // Wait for the loading state to be removed
    await waitFor(() => {
      expect(canvas.queryByText(/joining/i)).not.toBeInTheDocument();
    });
  },
};
