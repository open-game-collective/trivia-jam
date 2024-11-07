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
import { QuestionDisplay } from "./question-display";

const meta: Meta<typeof QuestionDisplay> = {
  title: "Game/QuestionDisplay",
  component: QuestionDisplay,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof QuestionDisplay>;

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
  _: React.ComponentProps<typeof QuestionDisplay>,
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
        <QuestionDisplay />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Default view with no question
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
            { id: "1", name: "Alice", score: 300 },
            { id: "2", name: "Bob", score: 250 },
            { id: "3", name: "Charlie", score: 200 },
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

// View with active question and buzzer queue
export const WithBuzzerQueue: Story = {
  render: (args) =>
    Template(
      args,
      {
        public: {
          id: "game-123",
          hostId: "host-456",
          hostName: "Host",
          players: [
            { id: "1", name: "Alice", score: 300 },
            { id: "2", name: "Bob", score: 250 },
            { id: "3", name: "Charlie", score: 200 },
          ],
          currentQuestion: {
            text: "What is 2 + 2?",
            isVisible: true,
          },
          buzzerQueue: ["1", "2", "3"],
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
            { id: "player-789", name: "You", score: 200 },
            { id: "2", name: "Bob", score: 250 },
            { id: "3", name: "Charlie", score: 300 },
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