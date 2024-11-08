import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { within, waitFor } from "@storybook/testing-library";
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

export const InLobby: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify lobby elements
    const title = await canvas.findByText(/waiting for game to start/i);
    expect(title).toBeInTheDocument();
    
    const playersHeading = await canvas.findByText(/players joined/i);
    expect(playersHeading).toBeInTheDocument();
  },
};

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify question is visible
    const question = await canvas.findByText(/what is the capital of france/i);
    expect(question).toBeInTheDocument();
    
    // Verify leaderboard is shown
    const leaderboard = await canvas.findByText(/leaderboard/i);
    expect(leaderboard).toBeInTheDocument();
    
    // Verify empty buzzer queue message
    const emptyQueue = await canvas.findByText(/waiting for players to buzz in/i);
    expect(emptyQueue).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify buzzer queue elements
    const answeringBadge = await canvas.findByText(/answering/i);
    expect(answeringBadge).toBeInTheDocument();
    
    // Verify queue order
    const queueItems = await canvas.findAllByRole('generic', { name: /player/i });
    expect(queueItems.length).toBe(2);
  },
};

export const MultipleBuzzersWithIncorrectAnswers: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: [
            "player-3", 
            "player-4", 
            "player-5"
          ],
          lastAnswerResult: {
            playerId: "player-2",
            playerName: "Emma",
            correct: false
          },
          players: [
            { id: "player-1", name: "John", score: 2 },
            { id: "player-2", name: "Emma", score: 1 },
            { id: "player-3", name: "Michael", score: 1 },
            { id: "player-4", name: "Sarah", score: 0 },
            { id: "player-5", name: "David", score: 0 },
          ],
          previousAnswers: [
            { playerId: "player-1", playerName: "John", correct: false },
            { playerId: "player-2", playerName: "Emma", correct: false },
          ]
        },
        value: { active: "answerValidation" }
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify previous wrong answers
    const wrongBadges = await canvas.findAllByText('Wrong');
    expect(wrongBadges).toHaveLength(2);
    
    // Verify current queue
    const currentPlayer = await canvas.findByText('Michael');
    expect(currentPlayer).toBeInTheDocument();
    
    // Verify scores are shown
    const johnScore = await canvas.findByText('2');
    expect(johnScore).toBeInTheDocument();
  },
};

export const ManyPreviousAnswers: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: {
            text: "What is the capital of France?",
            isVisible: true,
          },
          buzzerQueue: [
            "current-player",
            "next-player-1",
            "next-player-2",
          ],
          players: [
            { id: "current-player", name: "Current Player", score: 0 },
            { id: "next-player-1", name: "Next Player 1", score: 0 },
            { id: "next-player-2", name: "Next Player 2", score: 0 },
            ...Array.from({ length: 10 }, (_, i) => ({
              id: `wrong-${i}`,
              name: `Wrong Player ${i + 1}`,
              score: 0,
            })),
          ],
          previousAnswers: Array.from({ length: 10 }, (_, i) => ({
            playerId: `wrong-${i}`,
            playerName: `Wrong Player ${i + 1}`,
            correct: false,
          })),
        },
        value: { active: "answerValidation" }
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify all wrong answers are shown
    const wrongBadges = await canvas.findAllByText('Wrong');
    expect(wrongBadges).toHaveLength(10);
    
    // Verify current player is shown
    const currentPlayer = await canvas.findByText('Current Player');
    expect(currentPlayer).toBeInTheDocument();
    
    // Verify queue is shown
    const nextPlayers = await canvas.findAllByText(/Next Player/);
    expect(nextPlayers).toHaveLength(2);
  },
};

export const WaitingForNextQuestion: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: null,  // No current question yet
          buzzerQueue: [],        // Queue is cleared after correct answer
          players: [
            { id: "player-1", name: "John", score: 3 },
            { id: "player-2", name: "Emma", score: 1 },
            { id: "player-3", name: "Michael", score: 1 },
            { id: "player-4", name: "Sarah", score: 0 },
          ],
          lastAnswerResult: {
            playerId: "player-1",
            playerName: "John",
            correct: true
          },
          previousAnswers: [
            { playerId: "player-2", playerName: "Emma", correct: false },
            { playerId: "player-3", playerName: "Michael", correct: false },
          ]
        },
        value: { active: "questionPrep" }
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify waiting message
    const waitingMessage = await canvas.findByText(/waiting for question/i);
    expect(waitingMessage).toBeInTheDocument();
    
    // Verify previous answers
    const wrongBadges = await canvas.findAllByText('Wrong');
    expect(wrongBadges).toHaveLength(2);
    
    // Verify updated scores
    const johnScore = await canvas.findByText('3');
    expect(johnScore).toBeInTheDocument();
  },
};

export const CorrectAnswerCelebration: Story = {
  decorators: [
    createGameAndSessionDecorator({
      gameOverrides: {
        public: {
          gameStatus: "active" as const,
          currentQuestion: null,
          buzzerQueue: [],
          players: [
            { id: "player-1", name: "John", score: 3 },
            { id: "player-2", name: "Emma", score: 2 },
            { id: "player-3", name: "Michael", score: 1 },
            { id: "player-4", name: "Sarah", score: 0 },
          ],
          lastAnswerResult: {
            playerId: "player-2",
            playerName: "Emma",
            correct: true
          },
          previousAnswers: [
            { playerId: "player-3", playerName: "Michael", correct: false },
            { playerId: "player-4", playerName: "Sarah", correct: false },
          ]
        },
        value: { active: "questionPrep" }
      },
    }),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify celebration elements
    const correctMessage = await canvas.findByText(/correct!/i);
    expect(correctMessage).toBeInTheDocument();
    
    const playerName = await canvas.findByText('Emma');
    expect(playerName).toBeInTheDocument();
    
    // Verify score display
    const score = await canvas.findByText(/score: 2/i);
    expect(score).toBeInTheDocument();
    
    // Verify place display
    const placeText = await canvas.findByText(/#2/);
    expect(placeText).toBeInTheDocument();
  },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify game over elements
    const gameOverTitle = await canvas.findByText(/game over/i);
    expect(gameOverTitle).toBeInTheDocument();
    
    // Verify final scores are shown
    const finalScores = await canvas.findByText(/final scores/i);
    expect(finalScores).toBeInTheDocument();
    
    // Verify winner display
    const winnerText = await canvas.findByText(/wins!/i);
    expect(winnerText).toBeInTheDocument();
  },
};