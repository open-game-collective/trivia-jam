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
import { PlayerJoin } from "./player-join";

const meta: Meta<typeof PlayerJoin> = {
  title: "Game/PlayerJoin",
  component: PlayerJoin,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PlayerJoin>;

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
  _: React.ComponentProps<typeof PlayerJoin>,
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
        <PlayerJoin />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Empty game state
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
          userId: "player-789",
        },
        private: {
          gameIds: [],
        },
        value: { Initialization: "Ready" },
      }
    ),
};

// Game with some players
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
          gameIds: [],
        },
        value: { Initialization: "Ready" },
      }
    ),
};

// Test joining a game
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const JoinGameInteraction: Story = {
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
          userId: "player-789",
        },
        private: {
          gameIds: [],
        },
        value: { Initialization: "Ready" },
      },
      (event) => {
        lastSentEvent = event;
      }
    ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Fill in the form
    const gameCodeInput = canvas.getByLabelText(/game code/i);
    await userEvent.type(gameCodeInput, "GAME123");

    const nameInput = canvas.getByLabelText(/your name/i);
    await userEvent.type(nameInput, "TestPlayer");

    // Submit the form
    const joinButton = canvas.getByRole("button", { name: /join game/i });
    await userEvent.click(joinButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "JOIN_GAME",
      playerName: "TestPlayer",
    });
  },
}; 