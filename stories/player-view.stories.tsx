import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, within } from "@storybook/test";
import { userEvent } from "@storybook/testing-library";
import { withActorKit } from "actor-kit/storybook";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import { PlayerView } from "../app/components/player-view";
import { GameContext } from "../app/game.context";
import type { GameMachine } from "../app/game.machine";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot } from "./utils";

const meta = {
  title: "Views/PlayerView",
  component: PlayerView,
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
} satisfies Meta<typeof PlayerView>;

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
            userId: "player-456",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            players: [{ id: "player-456", name: "Test Player", score: 0 }],
          },
        },
      },
    },
  },
};

export const WaitingForQuestion: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "active",
            players: [{ id: "player-456", name: "Test Player", score: 0 }],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const QuestionVisible: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
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
              startTime: Date.now(),
              answers: [],
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
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
  play: async ({ mount, canvas }) => {
    const startTime = Date.now() - 5000; // Question started 5 seconds ago
    const answerTime = Date.now() - 2000; // Answer submitted 2 seconds ago

    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
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
            startTime: startTime,
            answers: [],
          },
          players: [{ id: "player-456", name: "Test Player", score: 0 }],
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
        <PlayerView />
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
    expect(timer).toHaveTextContent("25s"); // 30s - 5s = 25s remaining

    // Verify answer input
    const answerInput = await canvas.findByLabelText(/your answer/i);
    expect(answerInput).toBeInTheDocument();

    // Submit an answer
    await userEvent.type(answerInput, "1776");
    const submitButton = await canvas.findByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);

    // Update game state to reflect submitted answer
    gameClient.produce((draft) => {
      if (draft.public.currentQuestion) {
        draft.public.currentQuestion.answers.push({
          playerId: "player-456",
          playerName: "Test Player",
          value: 1776,
          timestamp: answerTime,
        });
      }
    });

    // Verify answer submitted state
    const submittedState = await canvas.findByTestId("answer-submitted");
    expect(submittedState).toBeInTheDocument();
    expect(submittedState).toHaveTextContent("3s"); // 5s - 2s = 3s to answer
  },
};

export const QuestionResults: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
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
                    playerId: "player-456",
                    playerName: "Test Player",
                    value: 1776,
                    timestamp: Date.now() - 5000,
                  },
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    value: 1775,
                    timestamp: Date.now() - 8000,
                  },
                  {
                    playerId: "player-3",
                    playerName: "Player 3",
                    value: 1777,
                    timestamp: Date.now() - 10000,
                  },
                ],
                scores: [
                  {
                    playerId: "player-456",
                    playerName: "Test Player",
                    points: 5,
                    position: 1,
                    timeTaken: 5,
                  },
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    points: 3,
                    position: 2,
                    timeTaken: 8,
                  },
                  {
                    playerId: "player-3",
                    playerName: "Player 3",
                    points: 2,
                    position: 3,
                    timeTaken: 10,
                  },
                ],
              },
            ],
            players: [
              { id: "player-456", name: "Test Player", score: 5 },
              { id: "player-2", name: "Player 2", score: 3 },
              { id: "player-3", name: "Player 3", score: 2 },
            ],
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
  play: async ({ mount, canvas }) => {
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
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: 1776,
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1777,
                  timestamp: Date.now() - 10000,
                },
              ],
              scores: [
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  points: 5,
                  position: 1,
                  timeTaken: 5,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  points: 3,
                  position: 2,
                  timeTaken: 8,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 2,
                  position: 3,
                  timeTaken: 10,
                },
              ],
            },
          ],
          players: [
            { id: "player-456", name: "Test Player", score: 5 },
            { id: "player-2", name: "Player 2", score: 3 },
            { id: "player-3", name: "Player 3", score: 2 },
          ],
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
        <PlayerView />
      </GameContext.ProviderFromClient>
    );

    // Verify results display
    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify player's result
    const playerResult = await canvas.findByTestId("player-result");
    expect(playerResult).toBeInTheDocument();
    expect(playerResult).toHaveTextContent("5 points");
    expect(playerResult).toHaveTextContent("#1");

    // Verify other players' results
    const allResults = await canvas.findAllByTestId(/^player-position-/);
    expect(allResults).toHaveLength(3);
  },
};

export const QuestionResultsNoPoints: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
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
                    playerId: "player-456",
                    playerName: "Test Player",
                    value: 1775,
                    timestamp: Date.now() - 25000,
                  },
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    value: 1776,
                    timestamp: Date.now() - 5000,
                  },
                  {
                    playerId: "player-3",
                    playerName: "Player 3",
                    value: 1776,
                    timestamp: Date.now() - 8000,
                  },
                ],
                scores: [
                  {
                    playerId: "player-2",
                    playerName: "Player 2",
                    points: 5,
                    position: 1,
                    timeTaken: 5,
                  },
                  {
                    playerId: "player-3",
                    playerName: "Player 3",
                    points: 3,
                    position: 2,
                    timeTaken: 8,
                  },
                  {
                    playerId: "player-456",
                    playerName: "Test Player",
                    points: 0,
                    position: 3,
                    timeTaken: 25,
                  },
                ],
              },
            ],
            players: [
              { id: "player-2", name: "Player 2", score: 5 },
              { id: "player-3", name: "Player 3", score: 3 },
              { id: "player-456", name: "Test Player", score: 0 },
            ],
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
  play: async ({ mount, canvas }) => {
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
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: 1775,
                  timestamp: Date.now() - 25000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1776,
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1776,
                  timestamp: Date.now() - 8000,
                },
              ],
              scores: [
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  points: 5,
                  position: 1,
                  timeTaken: 5,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 3,
                  position: 2,
                  timeTaken: 8,
                },
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  points: 0,
                  position: 3,
                  timeTaken: 25,
                },
              ],
            },
          ],
          players: [
            { id: "player-2", name: "Player 2", score: 5 },
            { id: "player-3", name: "Player 3", score: 3 },
            { id: "player-456", name: "Test Player", score: 0 },
          ],
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
        <PlayerView />
      </GameContext.ProviderFromClient>
    );

    // Verify results display
    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify player's result shows no points
    const playerResult = await canvas.findByTestId("player-result");
    expect(playerResult).toBeInTheDocument();
    expect(playerResult).toHaveTextContent("0 points");
    expect(playerResult).toHaveTextContent("#3");
    expect(playerResult).toHaveTextContent("25.0s");

    // Verify other players' results
    const allResults = await canvas.findAllByTestId(/^player-position-/);
    expect(allResults).toHaveLength(3);

    // Verify player's wrong answer is highlighted
    const playerRow = await canvas.findByTestId("player-position-3");
    expect(playerRow).toHaveTextContent("Test Player");
    expect(playerRow).toHaveTextContent("0 points");
  },
};

export const AnswerSubmitted: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
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
              startTime: Date.now() - 5000, // Started 5 seconds ago
              answers: [
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: 1775,
                  timestamp: Date.now() - 2000, // Answered 2 seconds ago
                },
              ],
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
            },
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ mount, canvas }) => {
    await mount(<PlayerView />);

    // Verify answer submitted state
    const submittedState = await canvas.findByTestId("answer-submitted");
    expect(submittedState).toBeInTheDocument();
    expect(submittedState).toHaveTextContent("1775");
    expect(submittedState).toHaveTextContent("2.0s");
  },
};

export const NoCorrectAnswers: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
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
            currentQuestion: null,
            questionResults: [{
              questionId: "q1",
              questionNumber: 1,
              answers: [
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: 1770,
                  timestamp: Date.now() - 10000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1780,
                  timestamp: Date.now() - 8000,
                },
              ],
              scores: [
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  points: 0,
                  position: 1,
                  timeTaken: 10.0,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  points: 0,
                  position: 2,
                  timeTaken: 8.0,
                },
              ],
            }],
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
            },
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const MultiplePlayersWithMixedAnswers: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
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
            currentQuestion: null,
            questionResults: [{
              questionId: "q1",
              questionNumber: 1,
              answers: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  value: 1776,
                  timestamp: Date.now() - 15000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1776,
                  timestamp: Date.now() - 14000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1775,
                  timestamp: Date.now() - 13000,
                },
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: 1780,
                  timestamp: Date.now() - 12000,
                },
                {
                  playerId: "player-5",
                  playerName: "Player 5",
                  value: 1770,
                  timestamp: Date.now() - 11000,
                },
                {
                  playerId: "player-6",
                  playerName: "Player 6",
                  value: 1785,
                  timestamp: Date.now() - 10000,
                },
                {
                  playerId: "player-7",
                  playerName: "Player 7",
                  value: 1765,
                  timestamp: Date.now() - 9000,
                },
                {
                  playerId: "player-8",
                  playerName: "Player 8",
                  value: 1790,
                  timestamp: Date.now() - 8000,
                },
              ],
              scores: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  points: 3,
                  position: 1,
                  timeTaken: 15.0,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  points: 2,
                  position: 2,
                  timeTaken: 14.0,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 1,
                  position: 3,
                  timeTaken: 13.0,
                },
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  points: 0,
                  position: 4,
                  timeTaken: 12.0,
                },
                {
                  playerId: "player-5",
                  playerName: "Player 5",
                  points: 0,
                  position: 5,
                  timeTaken: 11.0,
                },
                {
                  playerId: "player-6",
                  playerName: "Player 6",
                  points: 0,
                  position: 6,
                  timeTaken: 10.0,
                },
                {
                  playerId: "player-7",
                  playerName: "Player 7",
                  points: 0,
                  position: 7,
                  timeTaken: 9.0,
                },
                {
                  playerId: "player-8",
                  playerName: "Player 8",
                  points: 0,
                  position: 8,
                  timeTaken: 8.0,
                },
              ],
            }],
            players: [
              { id: "player-1", name: "Player 1", score: 3 },
              { id: "player-2", name: "Player 2", score: 2 },
              { id: "player-3", name: "Player 3", score: 1 },
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-5", name: "Player 5", score: 0 },
              { id: "player-6", name: "Player 6", score: 0 },
              { id: "player-7", name: "Player 7", score: 0 },
              { id: "player-8", name: "Player 8", score: 0 },
              { id: "player-9", name: "Player 9", score: 0 },
              { id: "player-10", name: "Player 10", score: 0 },
            ],
            settings: {
              maxPlayers: 10,
              questionCount: 10,
              answerTimeWindow: 30,
            },
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const NameEntryWithHelp: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-456",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            players: [],
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click the help button
    const helpButton = await canvas.findByRole('button', { name: /how to play/i });
    await userEvent.click(helpButton);
    
    // Verify help modal appears
    const modal = await canvas.findByText('How to Play');
    expect(modal).toBeInTheDocument();
    
    // Verify modal content
    expect(canvas.getByText('Game Basics')).toBeInTheDocument();
    expect(canvas.getByText('Scoring')).toBeInTheDocument();
    expect(canvas.getByText('Quick Tips')).toBeInTheDocument();
    
    // Close modal
    const closeButton = canvas.getByRole('button', { name: /let's play/i });
    await userEvent.click(closeButton);
    
    // Verify modal is closed
    await waitFor(() => {
      expect(canvas.queryByText('How to Play')).not.toBeInTheDocument();
    });
  },
};
