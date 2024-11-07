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
import { Scoreboard } from "./scoreboard";

const meta: Meta<typeof Scoreboard> = {
  title: "Game/Scoreboard",
  component: Scoreboard,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Scoreboard>;

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
  _: React.ComponentProps<typeof Scoreboard>,
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
        <Scoreboard />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Default view
export const Default: Story = {
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
            { id: "2", name: "Bob", score: 800 },
            { id: "3", name: "Charlie", score: 600 },
            { id: "4", name: "David", score: 400 },
            { id: "5", name: "Eve", score: 200 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "active",
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
        value: { active: "questionPrep" },
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

// View when you're in first place
export const YoureWinning: Story = {
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
          gameStatus: "active",
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
        value: { active: "questionPrep" },
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

// Close competition
export const CloseCompetition: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "1", name: "Alice", score: 500 },
            { id: "player-789", name: "You", score: 490 },
            { id: "3", name: "Charlie", score: 480 },
            { id: "4", name: "David", score: 470 },
          ],
          currentQuestion: null,
          buzzerQueue: [],
          gameStatus: "active",
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
        value: { active: "questionPrep" },
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