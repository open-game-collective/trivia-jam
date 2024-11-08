import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { HostView } from "../app/components/host-view";
import { createGameAndSessionDecorator } from "./utils";

const meta = {
  title: "Views/HostView",
  component: HostView,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof HostView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InLobby: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123", // Set user as host
    }),
  ],
};

export const StartingGame: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          hostId: "host-123",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
        },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify start button is initially enabled
    const startButton = canvas.getByRole('button', { name: /start game$/i });
    expect(startButton).toBeEnabled();
    
    // Click the start button
    await userEvent.click(startButton);
    
    // Verify loading state
    const loadingText = await canvas.findByText(/starting game/i);
    expect(loadingText).toBeInTheDocument();
    
    // Verify loading spinner
    const loadingSpinner = canvas.getByRole('status');
    expect(loadingSpinner).toBeInTheDocument();
    
    // Verify button is disabled during loading
    const disabledButton = canvas.getByRole('button');
    expect(disabledButton).toBeDisabled();
  },
};

export const AskingQuestion: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
        },
        value: { active: "questionPrep" }
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit a question
    const questionInput = canvas.getByPlaceholderText(/enter question/i);
    await userEvent.type(questionInput, "What is the capital of France?");
    const submitButton = canvas.getByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Verify question was submitted
    const showQuestionButton = await canvas.findByRole("button", { name: /show question/i });
    expect(showQuestionButton).toBeInTheDocument();
  },
};

export const ValidatingAnswer: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["player-456"],
        },
        value: { active: "answerValidation" }
      },
    }),
  ],
};

export const InLobbyNoPlayers: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          hostId: "host-123",
          players: [],
        },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify start button is disabled
    const startButton = canvas.getByRole('button', { name: /start game/i });
    expect(startButton).toBeDisabled();
    
    // Verify waiting message
    const waitingMessage = await canvas.findByText(/waiting for at least one player/i);
    expect(waitingMessage).toBeInTheDocument();
  },
};

export const InLobbyWithPlayers: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          hostId: "host-123",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
        },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify start button is enabled
    const startButton = canvas.getByRole('button', { name: /start game/i });
    expect(startButton).toBeEnabled();
    
    // Verify player count
    const playerCount = await canvas.findByText(/players \(2\)/i);
    expect(playerCount).toBeInTheDocument();
  },
};

export const CopyGameCode: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "host-123",
      gameOverrides: {
        public: {
          id: "GAME123",
          hostId: "host-123",
          players: [],
        },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Mock clipboard API
    const mockClipboard = {
      writeText: jest.fn(),
    };
    Object.assign(navigator, {
      clipboard: mockClipboard,
    });
    
    // Find and click the game code button
    const gameCodeButton = canvas.getByText("GAME123");
    await userEvent.click(gameCodeButton);
    
    // Verify clipboard was called
    expect(mockClipboard.writeText).toHaveBeenCalledWith("GAME123");
    
    // Verify success state
    const checkIcon = await canvas.findByTestId("check-icon");
    expect(checkIcon).toBeInTheDocument();
    
    // Verify it returns to copy icon
    await waitFor(
      () => {
        const copyIcon = canvas.getByTestId("copy-icon");
        expect(copyIcon).toBeInTheDocument();
      },
      { timeout: 2100 }
    );
  },
};

export const NonHostAccess: Story = {
  decorators: [
    createGameAndSessionDecorator({
      userId: "player-123", // Different from host ID
      gameOverrides: {
        public: {
          hostId: "host-456", // Different from user ID
          players: [
            { id: "player-123", name: "Regular Player", score: 0 },
          ],
        },
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify access denied message is shown
    const accessDenied = await canvas.findByText(/host controls not available/i);
    expect(accessDenied).toBeInTheDocument();
    
    // Verify explanation is shown
    const explanation = await canvas.findByText(/only the host can access these controls/i);
    expect(explanation).toBeInTheDocument();
    
    // Verify host controls are not shown
    const startButton = canvas.queryByRole('button', { name: /start game/i });
    expect(startButton).not.toBeInTheDocument();
  },
}; 