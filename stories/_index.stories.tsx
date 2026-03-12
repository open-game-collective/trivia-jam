/**
 * This file contains Storybook stories for the Index route component.
 * It demonstrates different states and interactions of the home page,
 * including both static and interactive scenarios.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { CallerSnapshotFrom } from "actor-kit";
import { withActorKit } from "actor-kit/storybook";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import type { LoaderData } from "../app/routes/_index";
import Index from "../app/routes/_index";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import type { RemixParameters } from "./utils";
import { withRemix } from "./utils";

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

// Display Stories
export const DefaultView: Story = {
  parameters: {
    remix: {
      initialPath: "/",
      loaderData: { gameId: TEST_GAME_ID, deviceType: "mobile", host: "dev.triviajam.tv", subscriberCount: 0 },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
    },
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
    },
  },
};

// Interactive Test Stories
export const TestJoinWithCode: Story = {
  parameters: {
    remix: {
      initialPath: "/?code=ABC123",
      loaderData: { gameId: TEST_GAME_ID, deviceType: "mobile", host: "dev.triviajam.tv", subscriberCount: 0 },
      userId: "user-123",
      sessionId: "session-123",
      pageSessionId: "page-session-123",
    },
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Index page now shows "Create New Game" instead of a game code input
    const createButton = canvas.getByRole("button", { name: /create new game/i });
    expect(createButton).toBeInTheDocument();
  },
};

export const TestJoinGameFlow: Story = {
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
      initialPath: "/",
      loaderData: { gameId: TEST_GAME_ID, deviceType: "mobile", host: "dev.triviajam.tv", subscriberCount: 0 },
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

    const canvas = await mount(
      <SessionContext.ProviderFromClient client={sessionClient}>
        <Index />
      </SessionContext.ProviderFromClient>
    );

    // Index page now shows "Create New Game" button that links to the game page
    const createButton = canvas.getByRole("button", { name: /create new game/i });
    expect(createButton).toBeInTheDocument();

    // Verify the link wrapping the button points to the game
    const createLink = canvas.getByRole("link", { name: /create new game/i });
    expect(createLink).toHaveAttribute("href", `/games/${TEST_GAME_ID}`);
  },
};
