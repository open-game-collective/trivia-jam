import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { SpectatorView } from "../app/components/spectator-view";
import { GameContext } from "../app/game.context";
import { SessionContext } from "../app/session.context";
import type { GameMachine } from "../app/game.machine";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit } from "./utils";
import { createActorKitMockClient } from "actor-kit/test";

const meta = {
  title: "Views/SpectatorView",
  component: SpectatorView,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    withActorKit<SessionMachine>({
      actorType: "session",
      context: SessionContext,
    }),
    withActorKit<GameMachine>({
      actorType: "game",
      context: GameContext,
    }),
  ],
} satisfies Meta<typeof SpectatorView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InLobby: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "spectator-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify lobby elements
    const title = await canvas.findByText(/waiting for game to start/i);
    expect(title).toBeInTheDocument();
    
    const playersHeading = await canvas.findByText(/players joined/i);
    expect(playersHeading).toBeInTheDocument();
  },
};

export const WithBuzzerQueue: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "spectator-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "active",
            currentQuestion: {
              text: "What is the capital of France?",
              isVisible: true,
            },
            buzzerQueue: ["player-1", "player-2"],
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify question is visible
    const question = canvas.getByTestId('current-question');
    expect(question).toBeInTheDocument();
    expect(question).toHaveTextContent('What is the capital of France?');

    // Verify buzzer queue section exists
    const queueSection = canvas.getByTestId('buzzer-queue-section');
    expect(queueSection).toBeInTheDocument();

    // Verify first player in queue
    const firstPlayer = canvas.getByTestId('queue-player-player-1');
    expect(firstPlayer).toBeInTheDocument();
    expect(firstPlayer).toHaveTextContent('Player 1');
    
    // Verify answering badge on first player
    const answeringBadge = canvas.getByTestId('answering-badge');
    expect(answeringBadge).toBeInTheDocument();
    expect(answeringBadge).toHaveTextContent('Answering');

    // Verify second player in queue
    const secondPlayer = canvas.getByTestId('queue-player-player-2');
    expect(secondPlayer).toBeInTheDocument();
    expect(secondPlayer).toHaveTextContent('Player 2');
  },
};

export const PlayerAnsweredCorrectly: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "spectator-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "active",
            currentQuestion: null,
            lastAnswerResult: {
              playerId: "player-1",
              playerName: "Player 1",
              correct: true,
            },
            players: [
              { id: "player-1", name: "Player 1", score: 1 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify celebration elements using test IDs
    const correctMessage = canvas.getByTestId('correct-message');
    expect(correctMessage).toBeInTheDocument();
    expect(correctMessage).toHaveTextContent(/correct/i);
    
    const winnerName = canvas.getByTestId('winner-name');
    expect(winnerName).toBeInTheDocument();
    expect(winnerName).toHaveTextContent('Player 1');
    
    const rankDisplay = canvas.getByTestId('rank-display');
    expect(rankDisplay).toBeInTheDocument();
    expect(rankDisplay).toHaveTextContent('#1');
    
    const scoreDisplay = canvas.getByTestId('score-display');
    expect(scoreDisplay).toBeInTheDocument();
    expect(scoreDisplay).toHaveTextContent('Score: 1');
  },
};

export const GameFinished: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "spectator-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "finished",
            winner: "player-1",
            players: [
              { id: "player-1", name: "Player 1", score: 3 },
              { id: "player-2", name: "Player 2", score: 1 },
            ],
          },
          value: "finished",
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify game over elements using test IDs
    const gameOverTitle = canvas.getByTestId('game-over-title');
    expect(gameOverTitle).toBeInTheDocument();
    expect(gameOverTitle).toHaveTextContent(/game over/i);
    
    // Find winner announcement section
    const winnerSection = canvas.getByTestId('winner-announcement');
    expect(winnerSection).toBeInTheDocument();
    expect(winnerSection).toHaveTextContent(/player 1.*wins/i);
    
    // Find Final Scores heading
    const scoresHeading = canvas.getByTestId('final-scores-heading');
    expect(scoresHeading).toBeInTheDocument();
    expect(scoresHeading).toHaveTextContent(/final scores/i);

    // Verify player scores using test IDs
    const player1Score = canvas.getByTestId('player-score-player-1');
    expect(player1Score).toBeInTheDocument();
    expect(player1Score).toHaveTextContent('Player 1');
    expect(player1Score).toHaveTextContent('3');
    
    const player2Score = canvas.getByTestId('player-score-player-2');
    expect(player2Score).toBeInTheDocument();
    expect(player2Score).toHaveTextContent('Player 2');
    expect(player2Score).toHaveTextContent('1');
  },
};