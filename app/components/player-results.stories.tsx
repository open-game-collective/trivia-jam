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
import { PlayerResults } from "./player-results";

const meta: Meta<typeof PlayerResults> = {
  title: "Game/PlayerResults",
  component: PlayerResults,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PlayerResults>;

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
  _: React.ComponentProps<typeof PlayerResults>,
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
        <PlayerResults />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Winner view
export const Winner: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 1000 },
            { id: "2", name: "Bob", score: 800 },
            { id: "3", name: "Charlie", score: 600 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "finished",
          winner: "player-789",
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "finished",
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

// Second place view
export const SecondPlace: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "1", name: "Alice", score: 1000 },
            { id: "player-789", name: "You", score: 800 },
            { id: "3", name: "Charlie", score: 600 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "finished",
          winner: "1",
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "finished",
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

// Test play again interaction
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const PlayAgainInteraction: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "1", name: "Alice", score: 1000 },
            { id: "player-789", name: "You", score: 800 },
            { id: "3", name: "Charlie", score: 600 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "finished",
          winner: "1",
          settings: {
            maxPlayers: 10,
            questionCount: 10,
          },
        },
        private: {
          lastBuzzTime: 0,
          hasAnswered: false,
        },
        value: "finished",
      },
      {
        public: {
          userId: "player-789",
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

    // Click the play again button
    const playAgainButton = canvas.getByRole("button", { name: /play again/i });
    await userEvent.click(playAgainButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "START_GAME",
    });
  },
}; 