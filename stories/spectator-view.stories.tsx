import type { Meta, StoryObj } from "@storybook/react";
import { SpectatorView } from "../app/components/spectator-view";
import { createGameAndSessionDecorator } from "./utils";

const meta = {
  title: "Views/SpectatorView",
  component: SpectatorView,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [createGameAndSessionDecorator()],
} satisfies Meta<typeof SpectatorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InLobby: Story = {};

export const ActiveGame: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
        },
        value: { active: "questionActive" }
      },
    }),
  ],
};

export const WithBuzzerQueue: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: ["player-456", "host-123"],
        },
        value: { active: "answerValidation" }
      },
    }),
  ],
};

export const GameFinished: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "finished" as const,
          winner: "player-456",
        },
        value: "finished"
      },
    }),
  ],
}; 