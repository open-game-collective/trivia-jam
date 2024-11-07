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
import { HostQuestionControl } from "./host-question-control";

const meta: Meta<typeof HostQuestionControl> = {
  title: "Game/HostQuestionControl",
  component: HostQuestionControl,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HostQuestionControl>;

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
  _: React.ComponentProps<typeof HostQuestionControl>,
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
        <HostQuestionControl />
      </GameContext.ProviderFromClient>
    </SessionContext.ProviderFromClient>
  );
};

// Default story with no players in queue
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
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
};

// Story with players in buzzer queue
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
            { id: "1", name: "Alice", score: 0 },
            { id: "2", name: "Bob", score: 0 },
            { id: "3", name: "Charlie", score: 0 },
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
          userId: "host-456",
        },
        private: {
          gameIds: ["game-123"],
        },
        value: { Initialization: "Ready" },
      }
    ),
};

// Test submitting a question
let lastSentEvent: ClientEventFrom<GameMachine> | null = null;

export const SubmitQuestionInteraction: Story = {
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

    // Type in a question
    const questionInput = canvas.getByLabelText(/question/i);
    await userEvent.type(questionInput, "What is 2 + 2?");

    // Click the Next Question button
    const nextButton = canvas.getByRole("button", { name: /next question/i });
    await userEvent.click(nextButton);

    // Assert the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "SUBMIT_QUESTION",
      question: "What is 2 + 2?",
    });
  },
};

// Test validating an answer
export const ValidateAnswerInteraction: Story = {
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
          currentQuestion: {
            text: "What is 2 + 2?",
            isVisible: true,
          },
          buzzerQueue: ["1"],
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

    // Click the correct answer button using the unique aria-label
    const correctButton = canvas.getByLabelText("Mark Answer Correct");
    await userEvent.click(correctButton);

    // Assert that the correct event was sent
    expect(lastSentEvent).toEqual({
      type: "VALIDATE_ANSWER",
      playerId: "1",
      correct: true,
    });
  },
}; 