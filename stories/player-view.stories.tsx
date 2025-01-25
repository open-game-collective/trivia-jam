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
              startTime: Date.now() - 5000,
              answers: [],
            },
            lastQuestionResult: null,
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
    await mount(<PlayerView />);

    // Verify question display
    const questionText = await canvas.findByText(
      "What year was the Declaration of Independence signed?"
    );
    expect(questionText).toBeInTheDocument();

    // Verify timer display
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent("25s");

    // Verify answer input
    const answerInput = await canvas.findByLabelText(/your answer/i);
    expect(answerInput).toBeInTheDocument();

    // Submit an answer
    await userEvent.type(answerInput, "1776");
    const submitButton = await canvas.findByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);

    // Verify answer submitted state
    const submittedState = await canvas.findByTestId("answer-submitted");
    expect(submittedState).toBeInTheDocument();

    // Verify submitted state content
    const submittedText = within(submittedState).getByText("Answer Submitted!");
    expect(submittedText).toBeInTheDocument();

    const submittedAnswer = within(submittedState).getByText("1776");
    expect(submittedAnswer).toBeInTheDocument();

    // Find the time element - it's split into "3" and "s"
    const timeContainer = within(submittedState).getByText((content, element) => {
      // Check if the element or its parent contains both "3" and "s"
      const elementText = element?.textContent || '';
      return elementText.includes('3') && elementText.includes('s');
    });
    expect(timeContainer).toBeInTheDocument();
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
    await mount(<PlayerView />);

    // Verify question text and correct answer
    const questionText = await canvas.findByRole('heading', {
      name: "What year was the Declaration of Independence signed?"
    });
    expect(questionText).toBeInTheDocument();

    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify first player result (Test Player)
    const player456Row = await canvas.findByTestId('player-result-player-456');
    expect(within(player456Row).getByText("Test Player")).toBeInTheDocument();
    expect(within(player456Row).getByText("1776")).toBeInTheDocument();
    expect(within(player456Row).getByText("5.0s")).toBeInTheDocument();
    expect(within(player456Row).getByText("5")).toBeInTheDocument();
    expect(within(player456Row).getByText("pts")).toBeInTheDocument();

    // Verify second player result (Player 2)
    const player2Row = await canvas.findByTestId('player-result-player-2');
    expect(within(player2Row).getByText("Player 2")).toBeInTheDocument();
    expect(within(player2Row).getByText("1775")).toBeInTheDocument();
    expect(within(player2Row).getByText("8.0s")).toBeInTheDocument();
    expect(within(player2Row).getByText("3")).toBeInTheDocument();
    expect(within(player2Row).getByText("pts")).toBeInTheDocument();

    // Verify third player result (Player 3)
    const player3Row = await canvas.findByTestId('player-result-player-3');
    expect(within(player3Row).getByText("Player 3")).toBeInTheDocument();
    expect(within(player3Row).getByText("1777")).toBeInTheDocument();
    expect(within(player3Row).getByText("10.0s")).toBeInTheDocument();
    expect(within(player3Row).getByText("2")).toBeInTheDocument();
    expect(within(player3Row).getByText("pts")).toBeInTheDocument();
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
    await mount(<PlayerView />);

    // Verify question text and correct answer
    const questionText = await canvas.findByRole('heading', {
      name: "What year was the Declaration of Independence signed?"
    });
    expect(questionText).toBeInTheDocument();

    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify first player result (Player 2 - highest score)
    const player2Row = await canvas.findByTestId('player-result-player-2');
    expect(within(player2Row).getByText("Player 2")).toBeInTheDocument();
    expect(within(player2Row).getByText("1776")).toBeInTheDocument();
    expect(within(player2Row).getByText("5.0s")).toBeInTheDocument();
    expect(within(player2Row).getByText("5")).toBeInTheDocument();
    expect(within(player2Row).getByText("pts")).toBeInTheDocument();

    // Verify second player result (Player 3)
    const player3Row = await canvas.findByTestId('player-result-player-3');
    expect(within(player3Row).getByText("Player 3")).toBeInTheDocument();
    expect(within(player3Row).getByText("1776")).toBeInTheDocument();
    expect(within(player3Row).getByText("8.0s")).toBeInTheDocument();
    expect(within(player3Row).getByText("3")).toBeInTheDocument();
    expect(within(player3Row).getByText("pts")).toBeInTheDocument();

    // Verify test player result (no points)
    const player456Row = await canvas.findByTestId('player-result-player-456');
    expect(within(player456Row).getByText("Test Player")).toBeInTheDocument();
    expect(within(player456Row).getByText("1775")).toBeInTheDocument();
    expect(within(player456Row).getByText("25.0s")).toBeInTheDocument();
    // No points assertions since this player scored 0
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
  play: async ({ mount, canvas }) => {
    await mount(<PlayerView />);

    // Find and click the help button
    const helpButton = await canvas.findByRole("button", { name: /how to play/i });
    expect(helpButton).toBeInTheDocument();
    await userEvent.click(helpButton);

    // TODO: Test drawer content once we figure out how to handle portals in Storybook
    // For now, we just verify the help button exists and can be clicked
  },
};
