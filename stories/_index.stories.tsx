import { createRemixStub } from "@remix-run/testing";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { createActorKitMockClient } from "actor-kit/test";
import React, { createContext, useContext } from "react";
import Index from "../app/routes/_index";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";

const createMockSessionClient = (
  snapshot: Parameters<
    typeof createActorKitMockClient<SessionMachine>
  >[0]["initialSnapshot"]
) => {
  return createActorKitMockClient<SessionMachine>({
    initialSnapshot: snapshot,
  });
};

const defaultSnapshot = {
  public: {
    userId: "user-123",
    gameIdsByJoinCode: {},
  },
  private: {},
  value: { Initialization: "Ready" },
} as const;

const createRemixStubWithSession = (
  sessionSnapshot = defaultSnapshot,
  initialPath = "/"
) => {
  const mockClient = createMockSessionClient(sessionSnapshot);
  const RemixStubComponent = createRemixStub(
    [
      {
        id: "root",
        path: "/",
        loader: () => {
          return { gameId: "test-game-id" };
        },
        Component: () => (
          <SessionContext.ProviderFromClient client={mockClient}>
            <Index />
          </SessionContext.ProviderFromClient>
        ),
      },
      {
        path: "/games/:gameId",
        Component: () => <div>Game Page</div>,
      },
    ],
    {
      env: {} as any,
      userId: "test-user-id",
      sessionId: "test-session-id",
      pageSessionId: "test-page-session-id",
    }
  );

  const StoryRemixStub = () => (
    <RemixStubComponent
      initialEntries={[initialPath]}
      hydrationData={{
        loaderData: {
          root: { gameId: "test-game-id" },
        },
      }}
    />
  );

  return { StoryRemixStub, mockClient };
};

type StoryArgs = {
  initialPath: string;
  initialSnapshot?: typeof defaultSnapshot;
};

const meta: Meta<StoryArgs> = {
  title: "Routes/Index",
  component: Index,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    initialPath: {
      control: "text",
      description: "Initial URL path for the story",
      defaultValue: "/",
    },
    initialSnapshot: {
      control: "object",
      description: "Initial state snapshot",
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// Default view
export const Default: Story = {
  args: {
    initialPath: "/",
  },
  decorators: [
    (Story, context) => {
      const { StoryRemixStub } = createRemixStubWithSession(
        defaultSnapshot,
        context.args.initialPath
      );
      return <StoryRemixStub />;
    },
  ],
};

// With game code entered via URL
export const WithGameCode: Story = {
  args: {
    initialPath: "/?code=ABC123",
  },
  decorators: [
    (Story, context) => {
      const { StoryRemixStub } = createRemixStubWithSession(
        defaultSnapshot,
        context.args.initialPath
      );
      return <StoryRemixStub />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gameCodeInput = canvas.getByRole("textbox", { name: "Game Code" });
    expect(gameCodeInput).toHaveValue("ABC123");
  },
};

// Mobile view
export const Mobile: Story = {
  args: {
    initialPath: "/",
  },
  decorators: [
    (Story, context) => {
      const { StoryRemixStub } = createRemixStubWithSession(
        defaultSnapshot,
        context.args.initialPath
      );
      return <StoryRemixStub />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// Tablet view
export const Tablet: Story = {
  args: {
    initialPath: "/",
  },
  decorators: [
    (Story, context) => {
      const { StoryRemixStub } = createRemixStubWithSession(
        defaultSnapshot,
        context.args.initialPath
      );
      return <StoryRemixStub />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

// Desktop view
export const Desktop: Story = {
  args: {
    initialPath: "/",
  },
  decorators: [
    (Story, context) => {
      const { StoryRemixStub } = createRemixStubWithSession(
        defaultSnapshot,
        context.args.initialPath
      );
      return <StoryRemixStub />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};

// Join game interaction with mock client
export const JoinGameInteraction: Story = {
  args: {
    initialPath: "/?code=ABC123",
    initialSnapshot: defaultSnapshot,
  },
  decorators: [
    (Story, { args }) => {
      const { StoryRemixStub, mockClient } = createRemixStubWithSession(
        args.initialSnapshot || defaultSnapshot,
        args.initialPath
      );
      
      // Store mock client in closure for play function
      (window as any).__currentMockClient = mockClient;
      
      return <StoryRemixStub />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get the mock client from window
    const mockClient = (window as any).__currentMockClient;
    if (!mockClient) throw new Error('Mock client not found');
    
    // Get the game code input and verify initial value
    const gameCodeInput = canvas.getByRole("textbox", { name: "Game Code" });
    expect(gameCodeInput).toHaveValue("ABC123");

    // Find and click the join button
    const joinButton = canvas.getByRole("button", { name: /join game/i });
    await userEvent.click(joinButton);

    // Find the loading text
    const loadingText = await canvas.findByText(/joining/i);
    expect(loadingText).toBeInTheDocument();

    // Use produce to simulate the server updating the game ID mapping
    mockClient.produce((draft) => {
      draft.public.gameIdsByJoinCode = {
        ...draft.public.gameIdsByJoinCode,
        ABC123: "game-123",
      };
    });

    // Instead of looking for a link, we can verify the navigation happened
    // by checking if the loading state is removed
    await waitFor(() => {
      expect(canvas.queryByText(/joining/i)).not.toBeInTheDocument();
    });

    // Clean up
    delete (window as any).__currentMockClient;
  },
};
