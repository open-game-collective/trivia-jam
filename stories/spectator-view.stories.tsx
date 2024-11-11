import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { within } from "@storybook/testing-library";
import { SpectatorView } from "../app/components/spectator-view";
import { GameContext } from "../app/game.context";
import type { GameMachine } from "../app/game.machine";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit } from "./utils";

const meta = {
  title: "Views/SpectatorView",
  component: SpectatorView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    host: "dev.triviajam.tv"  // Default host value
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
type Story = StoryObj<typeof SpectatorView>;

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

    // Verify player list
    const player1 = await canvas.findByText("Player 1");
    expect(player1).toBeInTheDocument();
    const player2 = await canvas.findByText("Player 2");
    expect(player2).toBeInTheDocument();

    // Verify empty slots
    const emptySlots = await canvas.findAllByText("Empty Slot");
    expect(emptySlots).toHaveLength(8); // 10 total slots - 2 players = 8 empty slots

    // Verify QR code section
    const qrCodeSection = await canvas.findByTestId("qr-code-section");
    expect(qrCodeSection).toBeInTheDocument();

    const qrCode = await canvas.findByTestId("game-qr-code");
    expect(qrCode).toBeInTheDocument();

    const qrLabel = await canvas.findByTestId("qr-code-label");
    expect(qrLabel).toHaveTextContent(/scan to join the game/i);
  },
};

export const WithBuzzerQueue: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "active",
            currentQuestion: {
              text: "What is the capital of France?",
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
    const question = await canvas.findByText("What is the capital of France?");
    expect(question).toBeInTheDocument();

    // Find the current answerer section and verify its content
    const currentAnswerer = await canvas.findByTestId("current-answerer");
    expect(currentAnswerer).toBeInTheDocument();
    expect(currentAnswerer).toHaveTextContent(/is answering/);

    // Verify "Up Next" section
    const upNextHeading = await canvas.findByText("Up Next");
    expect(upNextHeading).toBeInTheDocument();

    // Verify second player in queue using test ID
    const queuePlayer = await canvas.findByTestId("queue-player-player-2");
    expect(queuePlayer).toBeInTheDocument();
    expect(queuePlayer).toHaveTextContent("#2");
    expect(queuePlayer).toHaveTextContent("Player 2");
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
    const correctMessage = canvas.getByTestId("correct-message");
    expect(correctMessage).toBeInTheDocument();
    expect(correctMessage).toHaveTextContent(/correct/i);

    const winnerName = canvas.getByTestId("winner-name");
    expect(winnerName).toBeInTheDocument();
    expect(winnerName).toHaveTextContent("Player 1");

    const rankDisplay = canvas.getByTestId("rank-display");
    expect(rankDisplay).toBeInTheDocument();
    expect(rankDisplay).toHaveTextContent("#1");

    const scoreDisplay = canvas.getByTestId("score-display");
    expect(scoreDisplay).toBeInTheDocument();
    expect(scoreDisplay).toHaveTextContent("Score: 1");
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
    const gameOverTitle = canvas.getByTestId("game-over-title");
    expect(gameOverTitle).toBeInTheDocument();
    expect(gameOverTitle).toHaveTextContent(/game over/i);

    // Find winner announcement section
    const winnerSection = canvas.getByTestId("winner-announcement");
    expect(winnerSection).toBeInTheDocument();
    expect(winnerSection).toHaveTextContent(/player 1.*wins/i);

    // Find Final Scores heading
    const scoresHeading = canvas.getByTestId("final-scores-heading");
    expect(scoresHeading).toBeInTheDocument();
    expect(scoresHeading).toHaveTextContent(/final scores/i);

    // Verify player scores using test IDs
    const player1Score = canvas.getByTestId("player-score-player-1");
    expect(player1Score).toBeInTheDocument();
    expect(player1Score).toHaveTextContent("Player 1");
    expect(player1Score).toHaveTextContent("3");

    const player2Score = canvas.getByTestId("player-score-player-2");
    expect(player2Score).toBeInTheDocument();
    expect(player2Score).toHaveTextContent("Player 2");
    expect(player2Score).toHaveTextContent("1");
  },
};

export const WithIncorrectAnswers: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": defaultSessionSnapshot,
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "active",
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: ["player-3"], // Current player trying
            previousAnswers: [
              { playerId: "player-1", playerName: "Player 1", correct: false },
              { playerId: "player-2", playerName: "Player 2", correct: false },
            ],
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
              { id: "player-3", name: "Player 3", score: 0 },
            ],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify incorrect answers section exists
    const incorrectAnswersSection = await canvas.findByText(/previous incorrect answers/i);
    expect(incorrectAnswersSection).toBeInTheDocument();

    // Get all incorrect answer elements
    const incorrectAnswers = await canvas.findAllByTestId(/^incorrect-answer-/);
    expect(incorrectAnswers).toHaveLength(2);

    // Verify each incorrect answer has the correct styling
    incorrectAnswers.forEach(answer => {
      expect(answer.closest('div')).toHaveClass('bg-red-500/10');
    });

    // Verify current player in buzzer queue
    const currentAnswerer = await canvas.findByTestId("current-answerer");
    expect(currentAnswerer).toBeInTheDocument();
    expect(currentAnswerer).toHaveTextContent("Player 3");
    expect(currentAnswerer).toHaveTextContent(/is answering/i);
  },
};
