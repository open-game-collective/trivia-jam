import { expect } from "@storybook/jest";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import type {
  ActorKitClient,
  CallerSnapshotFrom,
  ClientEventFrom,
} from "actor-kit";
import { createActorKitMockClient } from "actor-kit/test";
import { cleanStores } from "nanostores";
import { GameContext } from "../game.context";
import type { GameMachine } from "../game.machine";
import { SessionContext } from "../session.context";
import type { SessionMachine } from "../session.machine";
import { HostControl } from "./host-control";
import { $showHelp, openHelp } from "./host-control.stores";

const meta: Meta<typeof HostControl> = {
  title: "Game/HostControl",
  component: HostControl,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HostControl>;

function createMockGameClient(
  snapshot: CallerSnapshotFrom<GameMachine>,
  onSend: (event: ClientEventFrom<GameMachine>) => void
): ActorKitClient<GameMachine> {
  return createActorKitMockClient<GameMachine>({
    snapshot,
    onSend,
  });
}

function createMockSessionClient(
  snapshot: CallerSnapshotFrom<SessionMachine>,
  onSend: (event: ClientEventFrom<SessionMachine>) => void
): ActorKitClient<SessionMachine> {
  return createActorKitMockClient<SessionMachine>({
    snapshot,
    onSend,
  });
}

const Template = (
  _: React.ComponentProps<typeof HostControl>,
  gameSnapshot: CallerSnapshotFrom<GameMachine>,
  sessionSnapshot: CallerSnapshotFrom<SessionMachine>,
  onGameEvent?: (event: ClientEventFrom<GameMachine>) => void
) => {
  const mockSessionClient = createMockSessionClient(
    sessionSnapshot,
    (event) => {
      console.log("Session event sent:", event);
    }
  );

  const mockGameClient = createMockGameClient(gameSnapshot, (event) => {
    console.log("Game event sent:", event);
    onGameEvent?.(event);
  });

  return (
    <SessionContext.ProviderFromClient client={mockSessionClient}>
      <GameContext.ProviderFromClient client={mockGameClient}>
        <HostControl />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

export const Default: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "lobby",
          winner: null,
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "lobby",
      },
      {
        public: {
          userId: "host-456",
        },
        private: {
          gameIds: [],
        },
        value: { Initialization: "Ready" },
      }
    ),
  args: {},
};

export const WithPlayers: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "1", name: "Alice", score: 0 },
            { id: "2", name: "Bob", score: 0 },
            { id: "3", name: "Charlie", score: 0 },
            { id: "4", name: "David", score: 0 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "lobby",
          winner: null,
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "lobby",
      },
      {
        public: {
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
  args: {},
};

export const WithSettings: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "lobby",
          winner: null,
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "lobby",
      },
      {
        public: {
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
  args: {},
};

export const WithHelp: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "lobby",
          winner: null,
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "lobby",
      },
      {
        public: {
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open help modal using the store
    openHelp();

    // Verify help content is visible
    expect(await canvas.findByText("Host Controls Help")).toBeInTheDocument();
    expect(await canvas.findByText("Game Settings")).toBeInTheDocument();
    expect(await canvas.findByText("Player Management")).toBeInTheDocument();
    expect(await canvas.findByText("Game Controls")).toBeInTheDocument();

    // Click close button
    const closeButton = canvas.getByText("Close Help");
    await userEvent.click(closeButton);

    // Verify modal is closed
    expect(canvas.queryByText("Host Controls Help")).not.toBeInTheDocument();
  },
  decorators: [
    (Story) => {
      // Clean up store after story
      cleanStores($showHelp);
      return <Story />;
    },
  ],
};

// Create a ref to store the last sent event
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const SettingsInteraction: Story = {
  render: (args) => {
    return Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "lobby",
          winner: null,
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "lobby",
      },
      {
        public: {
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      },
      (event) => {
        lastSentEvent = event;
      }
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click settings button
    const settingsButton = canvas.getByRole("button", { name: /settings/i });
    await userEvent.click(settingsButton);

    // Get the modal inputs using aria-label
    const maxPlayersInput = canvas.getByLabelText("Max Players");
    const questionCountInput = canvas.getByLabelText("Number of Questions");

    // Clear and set new values
    await userEvent.clear(maxPlayersInput);
    await userEvent.type(maxPlayersInput, "15");

    await userEvent.clear(questionCountInput);
    await userEvent.type(questionCountInput, "20");

    // Click save button
    const saveButton = canvas.getByRole("button", { name: /save settings/i });
    await userEvent.click(saveButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "UPDATE_SETTINGS",
      settings: {
        maxPlayers: 15,
        questionCount: 20,
      },
    });

    // Verify the modal is closed
    const modal = canvas.queryByRole("dialog");
    expect(modal).not.toBeInTheDocument();
  },
};
