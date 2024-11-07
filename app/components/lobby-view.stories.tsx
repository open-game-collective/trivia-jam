import { expect } from "@storybook/jest";
import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "@storybook/testing-library";
import type {
  ActorKitClient,
  CallerSnapshotFrom,
  ClientEventFrom,
} from "actor-kit";
import { createActorKitMockClient } from "actor-kit/test";
import { GameContext } from "../game.context";
import type { GameMachine } from "../game.machine";
import { SessionContext } from "../session.context";
import type { SessionMachine } from "../session.machine";
import { LobbyView } from "./lobby-view";

const meta: Meta<typeof LobbyView> = {
  title: "Game/LobbyView",
  component: LobbyView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LobbyView>;

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
  _: React.ComponentProps<typeof LobbyView>,
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
        <LobbyView />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Empty lobby view for host
export const EmptyLobbyHost: Story = {
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
};

// Lobby with players for host
export const WithPlayersHost: Story = {
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
};

// Lobby view for player
export const PlayerView: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 0 },
            { id: "2", name: "Bob", score: 0 },
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
          userId: "player-789",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
};

// Test starting the game
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const StartGameInteraction: Story = {
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
      },
      (event) => {
        lastSentEvent = event;
      }
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the start game button
    const startButton = canvas.getByRole("button", { name: /start game/i });
    await userEvent.click(startButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "START_GAME",
    });
  },
}; 