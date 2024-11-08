import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { PlayerView } from "../app/components/player-view";
import { createGameAndSessionDecorator, DecoratorClients } from "./utils";

const meta = {
  title: "Views/PlayerView",
  component: PlayerView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PlayerView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InLobby: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456", // Set user as player
    }),
  ],
};

export const WaitingForQuestion: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
        },
        value: { active: "questionPrep" },
      },
    }),
  ],
};

export const QuestionVisible: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
        },
        value: { active: "questionActive" },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find and click the buzz in button
    const buzzButton = canvas.getByRole("button", { name: /buzz in/i });
    await userEvent.click(buzzButton);

    // Verify player is in buzzer queue
    const waitingText = await canvas.findByText(/waiting for host/i);
    expect(waitingText).toBeInTheDocument();
  },
};

export const WaitingInBuzzerQueue: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["host-123", "player-456"],
        },
        value: { active: "answerValidation" },
      },
    }),
  ],
};

export const FirstInBuzzerQueue: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["player-456"],
        },
        value: { active: "answerValidation" },
      },
    }),
  ],
};

export const GameFinished: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "finished" as const,
          winner: "player-456",
        },
        value: "finished",
      },
    }),
  ],
};

export const PlayerAnsweredCorrectly: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: null,
          buzzerQueue: [],
          lastAnswerResult: {
            playerId: "player-456",
            playerName: "Test Player",
            correct: true,
          },
          players: [{ id: "player-456", name: "Test Player", score: 1 }],
        },
        value: { active: "questionPrep" },
      },
    }),
  ],
};

export const OtherPlayerAnsweredCorrectly: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: null,
          buzzerQueue: [],
          lastAnswerResult: {
            playerId: "player-789",
            playerName: "Other Player",
            correct: true,
          },
          players: [
            { id: "player-456", name: "Test Player", score: 0 },
            { id: "player-789", name: "Other Player", score: 1 },
          ],
        },
        value: { active: "questionPrep" },
      },
    }),
  ],
};

export const PlayerAnsweredIncorrectly: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["other-player"],
          lastAnswerResult: {
            playerId: "player-456",
            playerName: "Test Player",
            correct: false,
          },
          players: [{ id: "player-456", name: "Test Player", score: 0 }],
        },
        value: { active: "answerValidation" },
      },
    }),
  ],
};

export const OtherPlayerAnsweredIncorrectly: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-456",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["player-456"], // Current player is next in queue
          lastAnswerResult: {
            playerId: "player-789",
            playerName: "Sarah Smith", // Using a realistic name
            correct: false,
          },
          players: [
            { id: "player-456", name: "Test Player", score: 0 },
            { id: "player-789", name: "Sarah Smith", score: 0 },
          ],
        },
        value: { active: "answerValidation" },
      },
    }),
  ],
};

export const NameEntry: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "new-player",
      gameOverrides: {
        public: {
          gameStatus: "lobby" as const,
          players: [
            { id: "existing-player", name: "Existing Player", score: 0 },
          ],
        },
      },
    }),
  ],
  play: async ({ canvasElement, parameters }) => {
    const canvas = within(canvasElement);
    const { gameClient } = parameters.clients as DecoratorClients;

    // Verify name entry form is shown
    const nameInput = canvas.getByLabelText(/your name/i);
    expect(nameInput).toBeInTheDocument();

    // Enter a name
    await userEvent.type(nameInput, "New Player");

    // Submit the form
    const joinButton = canvas.getByRole("button", { name: /^join game$/i });
    await userEvent.click(joinButton);

    // Verify loading state
    const loadingButton = await canvas.findByRole("button", { name: /joining/i });
    expect(loadingButton).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(canvas.getByText("Joining...")).toBeInTheDocument();

    // Simulate the backend adding the player using gameClient directly
    gameClient.produce((draft) => {
      draft.public.players.push({
        id: "new-player",
        name: "New Player",
        score: 0,
      });
    });

    // Verify we see the lobby display
    const welcomeMessage = await canvas.findByText(/welcome, new player!/i);
    expect(welcomeMessage).toBeInTheDocument();
  },
};

export const NameEntryStatic: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "new-player",
      gameOverrides: {
        public: {
          gameStatus: "lobby" as const,
          players: [], // Empty players array to trigger name entry view
        },
      },
    }),
  ],
};
