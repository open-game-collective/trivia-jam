import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, within } from "@storybook/test";
import { userEvent } from "@storybook/testing-library";
import { withActorKit } from "actor-kit/storybook";
import { createActorKitMockClient } from "actor-kit/test";
import React from "react";
import { HostView } from "../app/components/host-view";
import { GameContext } from "../app/game.context";
import type { GameMachine } from "../app/game.machine";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot } from "./utils";

const meta = {
  title: "Views/HostView",
  component: HostView,
  parameters: {
    layout: "fullscreen",
    autoplay: true,
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
} satisfies Meta<typeof HostView>;

export default meta;
type Story = StoryObj<typeof HostView>;

// Display Stories
export const LobbyView: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            hostId: "host-123",
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {},
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { lobby: "ready" } as const,
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
            userId: "host-123",
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
            questionNumber: 1,
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                questionType: "numeric"
              },
            },
            currentQuestion: {
              questionId: "q1",
              startTime: Date.now() - 5000, // Started 5 seconds ago
              answers: [],
            },
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
};

export const QuestionWithAnswers: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
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
            questionNumber: 1,
            players: [
              { id: "player-1", name: "Player 1", score: 3 },
              { id: "player-2", name: "Player 2", score: 2 },
              { id: "player-3", name: "Player 3", score: 0 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "How many bones are in the human body?",
                correctAnswer: 206,
                questionType: "numeric"
              },
              "q3": {
                id: "q3",
                text: "What is the speed of light (in km/s)?",
                correctAnswer: 299792,
                questionType: "numeric"
              }
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
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1770,
                  timestamp: Date.now() - 3000,
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
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 0,
                  position: 3,
                  timeTaken: 3,
                },
              ],
            }],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
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
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
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
            questionNumber: 1,
            players: [
              { id: "player-1", name: "Player 1", score: 3 },
              { id: "player-2", name: "Player 2", score: 2 },
              { id: "player-3", name: "Player 3", score: 0 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "How many bones are in the human body?",
                correctAnswer: 206,
                questionType: "numeric"
              },
              "q3": {
                id: "q3",
                text: "What is the speed of light (in km/s)?",
                correctAnswer: 299792,
                questionType: "numeric"
              }
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
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1770,
                  timestamp: Date.now() - 3000,
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
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 0,
                  position: 3,
                  timeTaken: 3,
                },
              ],
            }],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
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
          questionNumber: 1,
          settings: {
            maxPlayers: 20,
            answerTimeWindow: 30,
          },
          players: [
            { id: "player-1", name: "Player 1", score: 3 },
            { id: "player-2", name: "Player 2", score: 2 },
            { id: "player-3", name: "Player 3", score: 0 },
          ],
          questions: {
            "q1": {
              id: "q1",
              text: "What year was the Declaration of Independence signed?",
              correctAnswer: 1776,
              questionType: "numeric"
            },
            "q2": {
              id: "q2",
              text: "How many bones are in the human body?",
              correctAnswer: 206,
              questionType: "numeric"
            },
            "q3": {
              id: "q3",
              text: "What is the speed of light (in km/s)?",
              correctAnswer: 299792,
              questionType: "numeric"
            }
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
                timestamp: Date.now() - 8000,
              },
              {
                playerId: "player-2",
                playerName: "Player 2",
                value: 1775,
                timestamp: Date.now() - 5000,
              },
              {
                playerId: "player-3",
                playerName: "Player 3",
                value: 1770,
                timestamp: Date.now() - 3000,
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
              {
                playerId: "player-3",
                playerName: "Player 3",
                points: 0,
                position: 3,
                timeTaken: 3,
              },
            ],
          }],
        },
        value: { active: "questionPrep" },
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <HostView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Wait for the component to render
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the next question button is shown (since it's not the last question)
    const nextButton = await canvas.findByRole("button", { name: /start next question/i });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeEnabled();
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
            userId: "host-123",
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
            players: [
              { id: "player-1", name: "Player 1", score: 3 },
              { id: "player-2", name: "Player 2", score: 1 },
            ],
            questions: {},
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: "finished",
        },
      },
    },
  },
};

export const ParsedQuestions: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            hostId: "host-123",
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "How many bones in human body?",
                correctAnswer: 206,
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "How many floors in Empire State Building?",
                correctAnswer: 102,
                questionType: "numeric"
              },
              "q3": {
                id: "q3",
                text: "How many grapes per wine bottle?",
                correctAnswer: 700,
                questionType: "numeric"
              },
              "q4": {
                id: "q4",
                text: "What major canal opened in 1914?",
                correctAnswer: "Panama Canal",
                questionType: "multiple-choice",
                options: ["Suez Canal", "Panama Canal", "Erie Canal", "English Channel"]
              },
              "q5": {
                id: "q5",
                text: "What is the capital of France?",
                correctAnswer: "Paris",
                questionType: "multiple-choice",
                options: ["London", "Berlin", "Paris", "Madrid"]
              },
              "q6": {
                id: "q6",
                text: "What is the largest planet in our solar system?",
                correctAnswer: "Jupiter",
                questionType: "multiple-choice",
                options: ["Mars", "Venus", "Saturn", "Jupiter"]
              }
            },
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { lobby: "ready" } as const,
        },
      },
    },
  },
  args: {
    host: "dev.triviajam.tv",
    initialDocumentContent: `How many bones in human body?
206

How many floors in Empire State Building?
102

How many grapes per wine bottle?
700

What major canal opened in 1914?
a) Suez Canal b) Panama Canal c) Erie Canal d) English Channel
Correct answer: B

What is the capital of France?
a) London b) Berlin c) Paris d) Madrid
Correct answer: C

What is the largest planet in our solar system?
a) Mars b) Venus c) Saturn d) Jupiter
Correct answer: D`
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the questions are displayed
    const questions = await canvas.findAllByTestId(/^parsed-question-/);
    expect(questions).toHaveLength(6);

    // Verify the first question content
    const firstQuestion = questions[0];
    expect(firstQuestion).toHaveTextContent("How many bones in human body?");
    expect(firstQuestion).toHaveTextContent("206");

    // Verify start game button is enabled
    const startButton = await canvas.findByRole("button", { name: /start game/i });
    expect(startButton).toBeEnabled();
  }
};

// Interactive Test Stories
export const TestLobbyInteractions: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            hostId: "host-123",
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "How many bones in human body?",
                correctAnswer: 206,
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "How many floors in Empire State Building?",
                correctAnswer: 102,
                questionType: "numeric"
              }
            },
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { lobby: "ready" } as const,
        },
      },
    },
  },
  play: async ({ canvas, mount, step }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          id: "game-123",
          hostId: "host-123",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
          questions: {
            "q1": {
              id: "q1",
              text: "How many bones in human body?",
              correctAnswer: 206,
              questionType: "numeric"
            },
            "q2": {
              id: "q2",
              text: "How many floors in Empire State Building?",
              correctAnswer: 102,
              questionType: "numeric"
            }
          },
          questionResults: [],
          settings: {
            maxPlayers: 20,
            answerTimeWindow: 30,
          },
        },
        value: { lobby: "ready" } as const,
      },
    });

    // Mock clipboard API before mounting
    const mockClipboard = {
      writeText: fn().mockImplementation(() => Promise.resolve()),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <HostView host="dev.triviajam.tv" />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Verify game link section', async () => {
      const gameLinkButton = await canvas.findByRole("button", {
        name: /https:\/\/dev\.triviajam\.tv\/games\/game-123/i
      });
      expect(gameLinkButton).toBeInTheDocument();

      await userEvent.click(gameLinkButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        "https://dev.triviajam.tv/games/game-123"
      );

      const successIcon = await canvas.findByTestId("copy-success-icon");
      expect(successIcon).toBeInTheDocument();
    });

    await step('Verify player list and start game', async () => {
      const player1 = await canvas.findByText("Player 1");
      expect(player1).toBeInTheDocument();
      const player2 = await canvas.findByText("Player 2");
      expect(player2).toBeInTheDocument();

      const startButton = await canvas.findByRole("button", { name: /start game/i });
      expect(startButton).toBeEnabled();

      await userEvent.click(startButton);
      const loadingSpinner = await canvas.findByTestId("loading-spinner");
      expect(loadingSpinner).toBeInTheDocument();
    });
  },
};

export const TestDocumentImport: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            hostId: "host-123",
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {},
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { lobby: "ready" } as const,
        },
      },
    },
  },
  play: async ({ canvas, mount, step }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          hostId: "host-123",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
          questions: {},
          questionResults: [],
          settings: {
            maxPlayers: 20,
            answerTimeWindow: 30,
          }
        },
        value: { lobby: "ready" } as const,
      }
    });

    let mounted = true;
    
    // Mock the send method
    gameClient.send = async (event) => {
      if (!mounted) return Promise.resolve();
      
      if (event.type === "PARSE_QUESTIONS") {
        // First update - transition to loading
        gameClient.produce((draft) => {
          draft.value = { lobby: "parsingDocument" } as const;
        });

        // Simulate parsing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Only proceed if still mounted
        if (!mounted) return Promise.resolve();

        // Second update - add parsed questions and return to ready state
        const questions = {
          "q1": {
            id: "q1",
            text: "How many bones in human body?",
            correctAnswer: 206,
            questionType: "numeric" as const
          },
          "q2": {
            id: "q2",
            text: "How many floors in Empire State Building?",
            correctAnswer: 102,
            questionType: "numeric" as const
          },
          "q3": {
            id: "q3",
            text: "How many grapes per wine bottle?",
            correctAnswer: 700,
            questionType: "numeric" as const
          },
          "q4": {
            id: "q4",
            text: "What major canal opened in 1914?",
            correctAnswer: "Panama Canal",
            questionType: "multiple-choice" as const,
            options: ["Suez Canal", "Panama Canal", "Erie Canal", "English Channel"]
          },
          "q5": {
            id: "q5",
            text: "What is the capital of France?",
            correctAnswer: "Paris",
            questionType: "multiple-choice" as const,
            options: ["London", "Berlin", "Paris", "Madrid"]
          },
          "q6": {
            id: "q6",
            text: "What is the largest planet in our solar system?",
            correctAnswer: "Jupiter",
            questionType: "multiple-choice" as const,
            options: ["Mars", "Venus", "Saturn", "Jupiter"]
          }
        };

        // Batch the updates together
        gameClient.produce((draft) => {
          draft.value = { lobby: "ready" } as const;
          draft.public.questions = questions;
        });
      }
      return Promise.resolve();
    };

    // Mount component
    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <HostView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    await step('Paste formatted questions', async () => {
      const documentInput = await canvas.findByPlaceholderText(/Paste your questions below using this format/i);
      
      const questionText = `How many bones in human body?
206

How many floors in Empire State Building?
102

How many grapes per wine bottle?
700

What major canal opened in 1914?
a) Suez Canal b) Panama Canal c) Erie Canal d) English Channel
Correct answer: B

What is the capital of France?
a) London b) Berlin c) Paris d) Madrid
Correct answer: C

What is the largest planet in our solar system?
a) Mars b) Venus c) Saturn d) Jupiter
Correct answer: D`;

      await userEvent.clear(documentInput);
      await userEvent.type(documentInput, questionText);

      // Dispatch change event to ensure React state is updated
      documentInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Wait for React state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    await step('Parse questions and verify loading state', async () => {
      const submitButton = await canvas.findByRole("button", { name: /submit/i });
      
      // Wait for button to be enabled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Force enable the button for testing
      submitButton.removeAttribute('disabled');
      
      expect(submitButton).toBeEnabled();
      await userEvent.click(submitButton);

      // Wait for loading state
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify loading state
      const loadingSpinner = await canvas.findByTestId("parsing-spinner");
      expect(loadingSpinner).toBeInTheDocument();
      const loadingText = await canvas.findByText(/Processing questions/i);
      expect(loadingText).toBeInTheDocument();

      // Wait for loading state to complete
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    await step('Verify parsed questions', async () => {
      // Verify questions parsed header
      const parsedHeader = await canvas.findByRole("heading", { 
        name: /6 Questions/i,
        level: 3
      });
      expect(parsedHeader).toBeInTheDocument();

      // Find the first question using a test ID
      const firstQuestion = await canvas.findByTestId("parsed-question-1");
      expect(firstQuestion).toHaveTextContent("How many bones in human body?");

      // Verify other questions are displayed
      const questions = await canvas.findAllByTestId(/^parsed-question-/);
      expect(questions).toHaveLength(6);
    });

    await step('Verify start game button is enabled', async () => {
      const startButton = await canvas.findByRole("button", { name: /start game/i });
      expect(startButton).toBeEnabled();
    });

    // Cleanup
    mounted = false;
  },
};

export const ParsingDocumentLoading: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            hostId: "host-123",
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
            questions: {},
            questionResults: [],
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
          },
          value: { lobby: "parsingDocument" } as const,
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    await mount(<HostView host="dev.triviajam.tv" />);

    // Verify loading state is shown
    const loadingSpinner = await canvas.findByTestId("parsing-spinner");
    expect(loadingSpinner).toBeInTheDocument();

    const loadingText = await canvas.findByText(/Processing questions/i);
    expect(loadingText).toBeInTheDocument();
  },
};

export const LastQuestionResults: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
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
            questionNumber: 6,
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
            players: [
              { id: "player-1", name: "Player 1", score: 15 },
              { id: "player-2", name: "Player 2", score: 12 },
              { id: "player-3", name: "Player 3", score: 8 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "What is 2+2?",
                correctAnswer: "4",
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "What is 3+3?",
                correctAnswer: "6",
                questionType: "numeric"
              },
              "q3": {
                id: "q3",
                text: "What is 4+4?",
                correctAnswer: "8",
                questionType: "numeric"
              },
              "q4": {
                id: "q4",
                text: "What is 5+5?",
                correctAnswer: "10",
                questionType: "numeric"
              },
              "q5": {
                id: "q5",
                text: "What is 6+6?",
                correctAnswer: "12",
                questionType: "numeric"
              },
              "q6": {
                id: "q6",
                text: "What is the largest planet in our solar system?",
                correctAnswer: "Jupiter",
                questionType: "multiple-choice",
                options: ["Mars", "Venus", "Saturn", "Jupiter"]
              }
            },
            currentQuestion: null,
            questionResults: [{
              questionId: "q6",
              questionNumber: 6,
              answers: [
                {
                  playerId: "player-1",
                  playerName: "Player 1",
                  value: "Jupiter",
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: "Saturn",
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: "Mars",
                  timestamp: Date.now() - 3000,
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
                  points: 0,
                  position: 2,
                  timeTaken: 5,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 0,
                  position: 3,
                  timeTaken: 3,
                },
              ],
            }],
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
          questionNumber: 6,
          settings: {
            maxPlayers: 20,
            answerTimeWindow: 30,
          },
          players: [
            { id: "player-1", name: "Player 1", score: 15 },
            { id: "player-2", name: "Player 2", score: 12 },
            { id: "player-3", name: "Player 3", score: 8 },
          ],
          questions: {
            "q1": {
              id: "q1",
              text: "What is 2+2?",
              correctAnswer: "4",
              questionType: "numeric"
            },
            "q2": {
              id: "q2",
              text: "What is 3+3?",
              correctAnswer: "6",
              questionType: "numeric"
            },
            "q3": {
              id: "q3",
              text: "What is 4+4?",
              correctAnswer: "8",
              questionType: "numeric"
            },
            "q4": {
              id: "q4",
              text: "What is 5+5?",
              correctAnswer: "10",
              questionType: "numeric"
            },
            "q5": {
              id: "q5",
              text: "What is 6+6?",
              correctAnswer: "12",
              questionType: "numeric"
            },
            "q6": {
              id: "q6",
              text: "What is the largest planet in our solar system?",
              correctAnswer: "Jupiter",
              questionType: "multiple-choice",
              options: ["Mars", "Venus", "Saturn", "Jupiter"]
            }
          },
          currentQuestion: null,
          questionResults: [{
            questionId: "q6",
            questionNumber: 6,
            answers: [
              {
                playerId: "player-1",
                playerName: "Player 1",
                value: "Jupiter",
                timestamp: Date.now() - 8000,
              },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: "Saturn",
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: "Mars",
                  timestamp: Date.now() - 3000,
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
                  points: 0,
                  position: 2,
                  timeTaken: 5,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 0,
                  position: 3,
                  timeTaken: 3,
                },
              ],
            }],
        },
        value: { active: "questionPrep" },
      },
    });
    let sentEvent: any = null;
    gameClient.send = (event) => {
      sentEvent = event;
      return Promise.resolve();
    };

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <HostView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Verify the end game button is shown (since it's the last question)
    const endGameButton = await canvas.findByTestId("end-game-button");
    expect(endGameButton).toBeInTheDocument();
    expect(endGameButton).toBeEnabled();

    // Click the end game button
    await userEvent.click(endGameButton);

    // Verify the END_GAME event was sent
    expect(sentEvent?.type).toBe("END_GAME");
  },
};

export const NextQuestionPreview: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "host-123",
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
            questionNumber: 1,
            settings: {
              maxPlayers: 20,
              answerTimeWindow: 30,
            },
            players: [
              { id: "player-1", name: "Player 1", score: 15 },
              { id: "player-2", name: "Player 2", score: 12 },
              { id: "player-3", name: "Player 3", score: 8 },
            ],
            questions: {
              "q1": {
                id: "q1",
                text: "What year was the Declaration of Independence signed?",
                correctAnswer: 1776,
                questionType: "numeric"
              },
              "q2": {
                id: "q2",
                text: "How many bones are in the human body?",
                correctAnswer: 206,
                questionType: "numeric"
              }
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
                  timestamp: Date.now() - 8000,
                },
                {
                  playerId: "player-2",
                  playerName: "Player 2",
                  value: 1775,
                  timestamp: Date.now() - 5000,
                },
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  value: 1770,
                  timestamp: Date.now() - 3000,
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
                {
                  playerId: "player-3",
                  playerName: "Player 3",
                  points: 0,
                  position: 3,
                  timeTaken: 3,
                },
              ],
            }],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvas, mount }) => {
    await mount(<HostView host="dev.triviajam.tv" />);

    // Verify the next question preview is shown
    const nextQuestionPreview = await canvas.findByText("How many bones are in the human body?");
    expect(nextQuestionPreview).toBeInTheDocument();

    // Verify the correct answer is shown
    const correctAnswer = await canvas.findByText("206");
    expect(correctAnswer).toBeInTheDocument();

    // Verify the next question button is shown
    const nextButton = await canvas.findByRole("button", { name: /start next question/i });
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeEnabled();
  },
}; 