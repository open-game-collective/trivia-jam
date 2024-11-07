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
import { PlayerGameView } from "./player-game-view";

const meta: Meta<typeof PlayerGameView> = {
  title: "Game/PlayerGameView",
  component: PlayerGameView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof PlayerGameView>;

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
  _: React.ComponentProps<typeof PlayerGameView>,
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
        <PlayerGameView />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Waiting for question
export const WaitingForQuestion: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 500 },
            { id: "2", name: "Bob", score: 400 },
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

// Question visible, can buzz
export const CanBuzz: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 500 },
            { id: "2", name: "Bob", score: 400 },
          ],
          currentQuestion: {
            text: "What is 2 + 2?",
            isVisible: true,
          },
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
        value: { active: "questionActive" },
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

// Has buzzed in
export const HasBuzzed: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 500 },
            { id: "2", name: "Bob", score: 400 },
          ],
          currentQuestion: {
            text: "What is 2 + 2?",
            isVisible: true,
          },
          buzzerQueue: ["player-789", "2"],
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
        value: { active: "answerValidation" },
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

// Test buzzing in
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const BuzzInInteraction: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "player-789", name: "You", score: 500 },
            { id: "2", name: "Bob", score: 400 },
          ],
          currentQuestion: {
            text: "What is 2 + 2?",
            isVisible: true,
          },
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
        value: { active: "questionActive" },
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

    // Click the buzz button
    const buzzButton = canvas.getByRole("button", { name: /buzz/i });
    await userEvent.click(buzzButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "BUZZ_IN",
    });
  },
}; 