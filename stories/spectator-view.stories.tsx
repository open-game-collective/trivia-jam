import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
import { withActorKit } from "actor-kit/storybook";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import { SpectatorView } from "../app/components/spectator-view";
import { GameContext } from "../app/game.context";
import type { GameMachine } from "../app/game.machine";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot } from "./utils";

const meta = {
  title: "Views/SpectatorView",
  component: SpectatorView,
  parameters: {
    layout: "fullscreen",
    autoplay: true,
  },
  args: {
    host: "dev.triviajam.tv", // Default host value
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

export const Docs: Story = {
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
};

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
  play: async ({ canvas, mount, step }) => {
    await step("Mount component with initial state", async () => {
      await mount(<SpectatorView host="dev.triviajam.tv" />);
    });

    await step("Verify lobby elements", async () => {
      const title = await canvas.findByText(/waiting for game to start/i);
      expect(title).toBeInTheDocument();

      const player1 = await canvas.findByText("Player 1");
      expect(player1).toBeInTheDocument();
      const player2 = await canvas.findByText("Player 2");
      expect(player2).toBeInTheDocument();
    });

    await step("Verify empty slots", async () => {
      const emptySlots = await canvas.findAllByText("Empty Slot");
      expect(emptySlots).toHaveLength(8);
    });

    await step("Verify QR code section", async () => {
      const qrCodeSection = await canvas.findByTestId("qr-code-section");
      expect(qrCodeSection).toBeInTheDocument();

      const qrCode = await canvas.findByTestId("game-qr-code");
      expect(qrCode).toBeInTheDocument();

      const qrLabel = await canvas.findByTestId("qr-code-label");
      expect(qrLabel).toHaveTextContent(/scan to join the game/i);
    });
  },
};

// Helper function to create players array
const createPlayers = (count: number, scores: Record<string, number> = {}) => 
  Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    score: scores[`player-${i + 1}`] || 0,
  }));

export const ActiveQuestionNoAnswers: Story = {
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
            id: "game-123",
            hostId: "host-123",
            gameStatus: "active",
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                requireExactAnswer: false,
              },
            },
            currentQuestion: {
              questionId: "q1",
              startTime: Date.now(),
              answers: [],
            },
            players: createPlayers(10),
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
              requireExactAnswers: false,
            },
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          id: "game-123",
          hostId: "host-123",
          gameStatus: "active",
          questions: {
            "q1": {
              id: "q1",
              text: "What year was the Declaration of Independence signed?",
              correctAnswer: 1776,
              requireExactAnswer: false,
            },
          },
          currentQuestion: {
            questionId: "q1",
            startTime: Date.now(),
            answers: [],
          },
          players: createPlayers(10),
          settings: {
            maxPlayers: 10,
            questionCount: 10,
            answerTimeWindow: 30,
          },
        },
        value: { active: "questionActive" },
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <SpectatorView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Verify question display
    const questionText = await canvas.findByText(
      "What year was the Declaration of Independence signed?"
    );
    expect(questionText).toBeInTheDocument();

    // Verify timer display
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent("30s");
  },
};

export const ActiveQuestionWithAnswers: Story = {
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
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                requireExactAnswer: false,
              },
            },
            currentQuestion: {
              questionId: "q1",
              startTime: Date.now() - 15000, // Started 15 seconds ago
              answers: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  value: 1776,
                  timestamp: Date.now() - 10000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 5000,
                },
              ],
            },
            players: createPlayers(10),
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
              requireExactAnswers: false,
            },
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
};

export const QuestionResults: Story = {
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
            id: "game-123",
            hostId: "host-123",
            gameStatus: "active",
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                requireExactAnswer: false,
              },
            },
            currentQuestion: null,
            questionResults: [
              {
                questionId: "q1",
                questionNumber: 1,
                answers: [
                  {
                    playerId: "player-1",
                    playerName: "Player 1",
                    value: 1776,
                    timestamp: Date.now() - 8000,
                  },
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    value: 1775,
                    timestamp: Date.now() - 5000,
                  },
                ],
                scores: [
                  {
                    playerId: "player-1",
                    playerName: "Player 1",
                    points: 3,
                    position: 1,
                    timeTaken: 8,
                  },
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    points: 2,
                    position: 2,
                    timeTaken: 5,
                  },
                ],
              },
            ],
            players: createPlayers(10, {
              "player-1": 3,
              "player-2": 2,
            }),
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
              requireExactAnswers: false,
            },
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          id: "game-123",
          hostId: "host-123",
          gameStatus: "active",
          questions: {
            "q1": {
              id: "q1",
              text: "What year was the Declaration of Independence signed?",
              correctAnswer: 1776,
              requireExactAnswer: false,
            },
          },
          currentQuestion: null,
          questionResults: [
            {
              questionId: "q1",
              questionNumber: 1,
              answers: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  value: 1776,
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 5000,
                },
              ],
              scores: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  points: 3,
                  position: 1,
                  timeTaken: 8,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  points: 2,
                  position: 2,
                  timeTaken: 5,
                },
              ],
            },
          ],
          players: createPlayers(10, {
            "player-1": 3,
            "player-2": 2,
          }),
          settings: {
            maxPlayers: 10,
            questionCount: 10,
            answerTimeWindow: 30,
          },
        },
        value: { active: "questionPrep" },
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <SpectatorView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Verify results display
    const questionText = await canvas.findByText("What year was the Declaration of Independence signed?");
    expect(questionText).toBeInTheDocument();

    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify player scores
    const player1Result = await canvas.findByTestId("player-result-player-1");
    expect(player1Result).toBeInTheDocument();
    expect(player1Result).toHaveTextContent("3 points");

    const player2Result = await canvas.findByTestId("player-result-player-2");
    expect(player2Result).toBeInTheDocument();
    expect(player2Result).toHaveTextContent("2 points");
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
            id: "game-123",
            hostId: "host-123",
            gameStatus: "finished",
            winner: "player-1",
            players: createPlayers(10, {
              "player-1": 15,
              "player-2": 12,
              "player-3": 9,
              "player-4": 7,
              "player-5": 5,
              "player-6": 4,
              "player-7": 3,
              "player-8": 2,
              "player-9": 1,
              "player-10": 0,
            }),
            questions: {},
            questionResults: [],
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
              requireExactAnswers: false,
            },
          },
          value: "finished",
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          id: "game-123",
          hostId: "host-123",
          gameStatus: "finished",
          winner: "player-1",
          players: createPlayers(10, {
            "player-1": 15,
            "player-2": 12,
            "player-3": 9,
            "player-4": 7,
            "player-5": 5,
            "player-6": 4,
            "player-7": 3,
            "player-8": 2,
            "player-9": 1,
            "player-10": 0,
          }),
          questions: {},
          questionResults: [],
          settings: {
            maxPlayers: 10,
            questionCount: 10,
            answerTimeWindow: 30,
          },
        },
        value: "finished",
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <SpectatorView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Verify game over elements using test IDs
    const gameOverTitle = await canvas.findByTestId("game-over-title");
    expect(gameOverTitle).toBeInTheDocument();
    expect(gameOverTitle).toHaveTextContent(/game over/i);

    // Find winner announcement section
    const winnerSection = await canvas.findByTestId("winner-announcement");
    expect(winnerSection).toBeInTheDocument();
    expect(winnerSection).toHaveTextContent(/player 1.*wins/i);

    // Find Final Scores heading
    const scoresHeading = await canvas.findByTestId("final-scores-heading");
    expect(scoresHeading).toBeInTheDocument();
    expect(scoresHeading).toHaveTextContent(/final scores/i);

    // Verify player scores using test IDs
    const player1Score = await canvas.findByTestId("player-score-player-1");
    expect(player1Score).toBeInTheDocument();
    expect(player1Score).toHaveTextContent("Player 1");
    expect(player1Score).toHaveTextContent("15");

    const player2Score = await canvas.findByTestId("player-score-player-2");
    expect(player2Score).toBeInTheDocument();
    expect(player2Score).toHaveTextContent("Player 2");
    expect(player2Score).toHaveTextContent("12");
  },
};

export const WaitingForQuestion: Story = {
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
            id: "game-123",
            hostId: "host-123",
            gameStatus: "active",
            questions: {},
            currentQuestion: null,
            questionResults: [],
            players: createPlayers(10, {
              "player-1": 3,
              "player-2": 2,
            }),
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
              requireExactAnswers: false,
            },
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    await mount(<SpectatorView host="dev.triviajam.tv" />);

    // Verify waiting state
    const waitingMessage = await canvas.findByTestId("waiting-for-question");
    expect(waitingMessage).toBeInTheDocument();
    expect(waitingMessage).toHaveTextContent(/waiting for next question/i);

    // Verify scores are still visible
    const player1Score = await canvas.findByText("Player 1");
    expect(player1Score).toBeInTheDocument();
  },
};

