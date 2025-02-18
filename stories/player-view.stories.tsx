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

// Display Stories
export const LobbyView: Story = {
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

export const QuestionPrep: Story = {
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

export const ActiveQuestion: Story = {
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
                questionType: "numeric",
              },
            },
            currentQuestion: {
              questionId: "q1",
              startTime: Date.now() - 5000,
              answers: [],
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
            settings: {
              maxPlayers: 10,
              answerTimeWindow: 30,
            },
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ mount, canvasElement }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          questions: {
            "q1": {
              id: "q1",
              text: "What year was the Declaration of Independence signed?",
              correctAnswer: 1776,
              questionType: "numeric",
            },
          },
          currentQuestion: {
            questionId: "q1",
            startTime: Date.now() - 5000,
            answers: [],
          },
          players: [
            { id: "player-456", name: "Test Player", score: 0 },
          ],
          settings: {
            maxPlayers: 10,
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
    
    const canvas = within(canvasElement);

    // Verify question display
    const questionText = await canvas.findByText(
      "What year was the Declaration of Independence signed?"
    );
    expect(questionText).toBeInTheDocument();

    // Verify timer display and wait for it to stabilize
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();

    // Wait for the timer to update and stabilize at 25s
    await waitFor(() => {
      const timer = canvas.getByTestId("question-timer");
      expect(timer.textContent).toBe("22s");
    }, { timeout: 4000 });

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
          timestamp: Date.now(),
        });
      }
    });

    // Verify answer submitted state
    const submittedState = await canvas.findByTestId("answer-submitted");
    expect(submittedState).toBeInTheDocument();

    // Verify submitted state content
    const submittedText = within(submittedState).getByText("Answer Submitted!");
    expect(submittedText).toBeInTheDocument();

    const submittedAnswer = within(submittedState).getByText("1776");
    expect(submittedAnswer).toBeInTheDocument();
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
          questions: {
            "q1": {
              id: "q1",
              text: "What year was the Declaration of Independence signed?",
              correctAnswer: 1776,
              questionType: "numeric",
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
        },
        value: { active: "questionPrep" },
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <PlayerView />
      </GameContext.ProviderFromClient>
    );

    // Verify question text and correct answer
    const questionText = await canvas.findByRole('heading', {
      name: "What year was the Declaration of Independence signed?"
    });
    expect(questionText).toBeInTheDocument();
    expect(questionText).toHaveClass(
      'text-6xl',
      'font-bold',
      'bg-clip-text',
      'text-transparent',
      'bg-gradient-to-r',
      'from-indigo-400',
      'to-purple-400',
      'mb-6'
    );

    const correctAnswer = await canvas.findByTestId("correct-answer");
    expect(correctAnswer).toBeInTheDocument();
    expect(correctAnswer).toHaveClass('text-5xl', 'font-bold', 'text-green-400');
    expect(correctAnswer).toHaveTextContent("1776");

    // Verify first player result (Test Player)
    const player456Row = await canvas.findByTestId('player-result-player-456');
    expect(player456Row).toBeInTheDocument();
    expect(player456Row).toHaveClass(
      'bg-green-500/10',
      'border',
      'border-green-500/30',
      'rounded-2xl',
      'p-6',
      'flex',
      'items-center',
      'gap-6',
      'bg-indigo-500/10'
    );
    
    const player456Details = within(player456Row);
    
    // Find player name in the specific element
    const nameElement = player456Details.getByText("Test Player", {
      selector: '.text-xl.font-medium'
    });
    expect(nameElement).toBeInTheDocument();

    // Find answer and time in the specific element
    const answerTimeElement = player456Details.getByText((content, element) => {
      return Boolean(
        element?.classList.contains('text-sm') && 
        element?.classList.contains('text-gray-400') && 
        content.includes('1776') && 
        content.includes('5.0s')
      );
    });
    expect(answerTimeElement).toBeInTheDocument();

    // Find points in the specific element
    const pointsElement = player456Details.getByText("5", {
      selector: '.text-2xl.font-bold.text-indigo-400'
    });
    expect(pointsElement).toBeInTheDocument();
  },
};

export const NoPointsResults: Story = {
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

    // Find answer and time in the specific element
    const answerTimeElement = within(player2Row).getByText((content, element) => {
      return Boolean(
        element?.classList.contains('text-sm') && 
        element?.classList.contains('text-gray-400') && 
        content.includes('1776') && 
        content.includes('5.0s')
      );
    });
    expect(answerTimeElement).toBeInTheDocument();

    // Find points in the specific element
    const pointsElement = within(player2Row).getByText("5", {
      selector: '.text-2xl.font-bold.text-indigo-400'
    });
    expect(pointsElement).toBeInTheDocument();

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

export const NoAnswersResults: Story = {
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

export const MultiplayerResults: Story = {
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

// Interactive Test Stories
export const TestNameEntry: Story = {
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

export const ActiveMultipleChoiceQuestion: Story = {
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
                text: "What major canal opened in 1914?",
                correctAnswer: "Panama Canal",
                questionType: "multiple-choice",
                options: ["Suez Canal", "Panama Canal", "Erie Canal", "English Channel"],
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
    const questionText = await canvas.findByText("What major canal opened in 1914?");
    expect(questionText).toBeInTheDocument();

    // Verify timer display
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent("25s");

    // Verify multiple choice options are displayed
    const options = await canvas.findAllByRole("button", { name: /(Suez Canal|Panama Canal|Erie Canal|English Channel)/ });
    expect(options).toHaveLength(4);

    // Verify each option is clickable
    const suezOption = options.find(opt => opt.textContent?.includes("Suez Canal"));
    const panamaOption = options.find(opt => opt.textContent?.includes("Panama Canal"));
    const erieOption = options.find(opt => opt.textContent?.includes("Erie Canal"));
    const channelOption = options.find(opt => opt.textContent?.includes("English Channel"));

    expect(suezOption).toBeInTheDocument();
    expect(panamaOption).toBeInTheDocument();
    expect(erieOption).toBeInTheDocument();
    expect(channelOption).toBeInTheDocument();
  },
};

export const MultipleChoiceAnswerSubmitted: Story = {
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
                text: "What major canal opened in 1914?",
                correctAnswer: "Panama Canal",
                questionType: "multiple-choice",
                options: ["Suez Canal", "Panama Canal", "Erie Canal", "English Channel"],
              },
            },
            currentQuestion: {
              questionId: "q1",
              startTime: Date.now(),
              answers: [
                {
                  playerId: "player-456",
                  playerName: "Test Player",
                  value: "Panama Canal",
                  timestamp: Date.now() - 2000,
                },
              ],
            },
            lastQuestionResult: null,
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

    // Verify question display
    const questionText = await canvas.findByText("What major canal opened in 1914?");
    expect(questionText).toBeInTheDocument();

    // Verify timer display
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();

    // Wait for the timer to update and stabilize
    await waitFor(() => {
      const timer = canvas.getByTestId("question-timer");
      const timeValue = parseInt(timer.textContent!);
      expect(timeValue).toBeGreaterThanOrEqual(25);
    }, { timeout: 2000 });

    // Verify answer submitted state
    const submittedState = await canvas.findByTestId("answer-submitted");
    expect(submittedState).toBeInTheDocument();

    // Verify submitted answer content
    const submittedText = within(submittedState).getByText("Answer Submitted!");
    expect(submittedText).toBeInTheDocument();

    const submittedAnswer = within(submittedState).getByText("Panama Canal");
    expect(submittedAnswer).toBeInTheDocument();

    // Find the time element
    const timeContainer = within(submittedState).getByText((content, element) => {
      const elementText = element?.textContent || '';
      return elementText.includes('3') && elementText.includes('s');
    });
    expect(timeContainer).toBeInTheDocument();
  },
};

export const LongMultipleChoiceQuestion: Story = {
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
                text: "Which AI-powered humanoid robot became the first robot to be granted citizenship?",
                correctAnswer: "Sophia by Hanson Robotics",
                questionType: "multiple-choice",
                options: [
                  "Off-pump coronary artery bypass (OPCAB)",
                  "Transcatheter aortic valve replacement (TAVR)",
                  "Robotic-assisted angioplasty",
                  "ECMO-supported surgery",
                  "Endovascular coiling"
                ],
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
    const questionText = await canvas.findByText("Which AI-powered humanoid robot became the first robot to be granted citizenship?");
    expect(questionText).toBeInTheDocument();

    // Verify timer display
    const timer = await canvas.findByTestId("question-timer");
    expect(timer).toBeInTheDocument();
    expect(timer).toHaveTextContent("25s");

    // Verify multiple choice options are displayed and properly aligned
    const options = await canvas.findAllByRole("button");
    expect(options).toHaveLength(5);

    // Verify each option has the correct layout
    options.forEach((option) => {
      const letterElement = option.querySelector(".text-indigo-400");
      const textElement = option.querySelector(".text-left");
      
      expect(letterElement).toBeInTheDocument();
      expect(textElement).toBeInTheDocument();
      expect(option).toHaveClass(
        "w-full",
        "bg-gray-800/50",
        "rounded-xl",
        "border",
        "border-gray-700/50"
      );
    });
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
            userId: "player-456",
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
              { id: "player-1", name: "Player 1", score: 15 },
              { id: "player-2", name: "Player 2", score: 12 },
              { id: "player-3", name: "Player 3", score: 9 },
              { id: "player-456", name: "You", score: 7 }, // Current player
              { id: "player-5", name: "Player 5", score: 5 },
              { id: "player-6", name: "Player 6", score: 4 },
              { id: "player-7", name: "Player 7", score: 3 },
              { id: "player-8", name: "Player 8", score: 2 },
              { id: "player-9", name: "Player 9", score: 1 },
              { id: "player-10", name: "Player 10", score: 0 },
            ],
          },
          value: "finished",
        },
      },
    },
  },
  play: async ({ mount, canvas }) => {
    await mount(<PlayerView />);

    // Verify game over title
    const gameOverTitle = await canvas.findByText("Game Over!");
    expect(gameOverTitle).toBeInTheDocument();

    // Verify winner announcement
    const winnerName = await canvas.findByText("Player 1 Wins!");
    expect(winnerName).toBeInTheDocument();
    const winnerScore = await canvas.findByText("with 15 points");
    expect(winnerScore).toBeInTheDocument();

    // Verify all players are shown
    for (let i = 1; i <= 10; i++) {
      const playerName = i === 4 ? "You" : `Player ${i}`;
      const playerElement = await canvas.findByText(playerName);
      expect(playerElement).toBeInTheDocument();
    }

    // Verify medals for top 3
    const goldMedal = await canvas.findByText("🥇");
    expect(goldMedal).toBeInTheDocument();
    const silverMedal = await canvas.findByText("🥈");
    expect(silverMedal).toBeInTheDocument();
    const bronzeMedal = await canvas.findByText("🥉");
    expect(bronzeMedal).toBeInTheDocument();

    // Verify current player (You) is highlighted
    const currentPlayerRow = (await canvas.findByText("You")).closest("div[class*='bg-indigo-500/10']");
    expect(currentPlayerRow).toBeInTheDocument();
  },
};
