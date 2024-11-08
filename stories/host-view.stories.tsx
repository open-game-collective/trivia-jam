import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
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
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const startButton = canvas.getByRole("button", { name: /start game/i });
    await userEvent.click(startButton);
    
    // Verify game state changed
    const questionInput = await canvas.findByPlaceholderText(/enter question/i);
    expect(questionInput).toBeInTheDocument();
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