import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { PlayerView } from "../app/components/player-view";
import { GameContext } from "../app/game.context";
import { SessionContext } from "../app/session.context";
import type { GameMachine } from "../app/game.machine";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit, withRemix } from "./utils";
import { createActorKitMockClient } from "actor-kit/test";
import type { loader } from "../app/routes/games.$gameId";  // Import the loader type

const meta = {
  title: "Views/PlayerView",
  component: PlayerView,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    withRemix<Awaited<ReturnType<typeof loader>>>(),  // Use the loader return type
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
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
          },
        },
      },
    },
  },
};

export const WaitingForQuestion: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const QuestionVisible: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          gameStatus: "active",
          currentQuestion: {
            text: "What is the capital of France?",
          },
          players: [
            { id: "player-456", name: "Test Player", score: 0 },
          ],
        },
        value: { active: "questionActive" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Verify question and buzz button are visible', async () => {
      // Check that the question is displayed
      const question = await canvas.findByTestId("current-question");
      expect(question).toBeInTheDocument();
      expect(question).toHaveTextContent("What is the capital of France?");

      // Check that the buzz button is available
      const buzzButton = await canvas.findByTestId("buzz-button");
      expect(buzzButton).toBeInTheDocument();
    });

    await step('Click buzz in button', async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      await userEvent.click(buzzButton);

      // Simulate backend adding player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-456"];
        draft.value = { active: "answerValidation" };
      });
    });

    await step('Verify player is in buzzer queue', async () => {
      const answeringStatus = await canvas.findByTestId("answering-status");
      expect(answeringStatus).toHaveTextContent(/your turn to answer/i);
    });

    await step('Simulate correct answer', async () => {
      // Simulate host validating answer as correct
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
        draft.public.players[0].score = 1;
        draft.public.lastAnswerResult = {
          playerId: "player-456",
          playerName: "Test Player",
          correct: true,
        };
        draft.public.currentQuestion = null;
        draft.value = { active: "questionPrep" };
      });

      // Verify correct answer feedback
      const answerFeedback = await canvas.findByTestId("answer-feedback");
      expect(answerFeedback).toBeInTheDocument();
      
      const playerFeedback = await canvas.findByTestId("player-feedback");
      expect(playerFeedback).toHaveTextContent(/correct/i);
      
      // Verify score update
      const scoreDisplay = await canvas.findByTestId("score-display");
      expect(scoreDisplay).toHaveTextContent("1");
    });
  },
};

export const PlayerAnsweredIncorrectly: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: ["player-456"],
            lastAnswerResult: {
              playerId: "player-456",
              playerName: "Test Player",
              correct: false,
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
            ],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    await step('Mount component with initial state', async () => {
      await mount(<PlayerView />);
    });

    await step('Verify incorrect answer feedback', async () => {
      // Use test IDs to find elements
      const answerFeedback = await canvas.findByTestId("answer-feedback");
      expect(answerFeedback).toBeInTheDocument();
      
      const playerFeedback = await canvas.findByTestId("player-feedback");
      expect(playerFeedback).toHaveTextContent(/incorrect/i);
      
      // Verify score remains at 0
      const scoreDisplay = await canvas.findByTestId("score-display");
      expect(scoreDisplay).toHaveTextContent("0");

      // Verify current question is still visible
      const questionArea = await canvas.findByTestId("question-area");
      expect(questionArea).toHaveTextContent("What is the capital of France?");

      // Verify buzz button is not present after incorrect answer
      const buzzButton = canvas.queryByTestId("buzz-button");
      expect(buzzButton).not.toBeInTheDocument();
    });
  },
};

export const NameEntry: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "new-player",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "lobby",
            players: [],
            questionNumber: 0,
          },
          value: { lobby: "ready" },
        },
      },
    },
  },
};

export const NameEntryInteraction: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "new-player",
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            gameStatus: "lobby",
            players: [],
            questionNumber: 0,
          },
          value: { lobby: "ready" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          gameStatus: "lobby",
          players: [],
          questionNumber: 0,
        },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Enter player name', async () => {
      const nameInput = canvas.getByLabelText(/your name/i);
      await userEvent.type(nameInput, "New Player");
    });

    await step('Submit name', async () => {
      const joinButton = canvas.getByRole("button", { name: /^join game$/i });
      await userEvent.click(joinButton);

      // Verify loading state
      const loadingButton = await canvas.findByRole("button", { name: /joining/i });
      expect(loadingButton).toBeDisabled();

      // Simulate backend adding player
      gameClient.produce((draft) => {
        draft.public.players.push({
          id: "new-player",
          name: "New Player",
          score: 0,
        });
      });
    });

    await step('Verify joined successfully', async () => {
      const welcomeMessage = await canvas.findByText(/welcome, new player!/i);
      expect(welcomeMessage).toBeInTheDocument();
    });
  },
};

export const PlayerAnsweredCorrectly: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: null,
            buzzerQueue: [],
            lastAnswerResult: {
              playerId: "player-456",
              playerName: "Test Player",
              correct: true,
            },
            players: [
              { id: "player-456", name: "Test Player", score: 1 },
            ],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const AlreadyBuzzedIn: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: [], // Empty queue after being removed
            previousAnswers: [
              {
                playerId: "player-456",
                playerName: "Test Player",
                correct: false,
              }
            ],
            lastAnswerResult: {
              playerId: "player-456",
              playerName: "Test Player",
              correct: false,
            },
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-789", name: "Other Player", score: 0 },
            ],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    await step('Mount component with initial state', async () => {
      await mount(<PlayerView />);
    });

    await step('Verify question is visible', async () => {
      // The question should still be visible
      const question = await canvas.findByText("What is the capital of France?");
      expect(question).toBeInTheDocument();
    });

    await step('Verify buzz button is not present after incorrect answer', async () => {
      // The buzz button should not be present since player already answered incorrectly
      const buzzButton = canvas.queryByRole('button', { name: /buzz/i });
      expect(buzzButton).not.toBeInTheDocument();
    });

    await step('Verify incorrect answer feedback', async () => {
      // Should show the incorrect answer feedback
      const feedbackMessage = await canvas.findByText(/sorry, that's incorrect/i);
      expect(feedbackMessage).toBeInTheDocument();
    });
  },
};

export const QuestionWithBuzzer: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: [], // Empty queue, player hasn't buzzed yet
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-789", name: "Other Player", score: 0 },
            ],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          gameStatus: "active",
          currentQuestion: {
            text: "What is the capital of France?",
          },
          buzzerQueue: [],
          players: [
            { id: "player-456", name: "Test Player", score: 0 },
            { id: "player-789", name: "Other Player", score: 0 },
          ],
        },
        value: { active: "questionActive" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Verify question is visible', async () => {
      const question = await canvas.findByText("What is the capital of France?");
      expect(question).toBeInTheDocument();
    });

    await step('Verify buzz button is present', async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      expect(buzzButton).toBeInTheDocument();
    });

    await step('Click buzz button', async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      await userEvent.click(buzzButton);

      // Simulate backend adding player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-456"];
      });
    });

    await step('Verify player is first in queue', async () => {
      const turnMessage = await canvas.findByText(/your turn to answer/i);
      expect(turnMessage).toBeInTheDocument();
    });
  },
};

export const MultiplePlayersAnswering: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-1", // First player
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
            },
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step }) => {
    const canvas = within(canvasElement);
    
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          gameStatus: "active",
          currentQuestion: {
            text: "What is the capital of France?",
          },
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
        },
        value: { active: "questionActive" },
      },
    });

    const sessionClient1 = createActorKitMockClient<SessionMachine>({
      initialSnapshot: {
        ...defaultSessionSnapshot,
        public: {
          ...defaultSessionSnapshot.public,
          userId: "player-1",
        },
        value: { Initialization: "Ready" as const },
      },
    });

    const sessionClient2 = createActorKitMockClient<SessionMachine>({
      initialSnapshot: {
        ...defaultSessionSnapshot,
        public: {
          ...defaultSessionSnapshot.public,
          userId: "player-2",
        },
        value: { Initialization: "Ready" as const },
      },
    });

    await step('Mount component and first player buzzes in', async () => {
      await mount(
        <SessionContext.ProviderFromClient client={sessionClient1}>
          <GameContext.ProviderFromClient client={gameClient}>
            <PlayerView />
          </GameContext.ProviderFromClient>
        </SessionContext.ProviderFromClient>
      );

      const buzzButton = canvas.getByRole("button", { name: /buzz/i });
      await userEvent.click(buzzButton);

      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-1"];
        draft.value = { active: "answerValidation" };
      });
    });

    await step('Verify first player is answering', async () => {
      const yourTurnText = await canvas.findByText(/your turn to answer/i);
      expect(yourTurnText).toBeInTheDocument();
    });

    await step('Simulate incorrect answer from first player', async () => {
      // Simulate host marking answer as incorrect
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
        draft.public.lastAnswerResult = {
          playerId: "player-1",
          playerName: "Player 1",
          correct: false,
        };
        draft.public.previousAnswers = [{
          playerId: "player-1",
          playerName: "Player 1",
          correct: false,
        }];
        draft.value = { active: "questionActive" };
      });
    });

    await step('Verify incorrect answer feedback', async () => {
      // Use test IDs instead of text content
      const answerFeedback = await canvas.findByTestId("answer-feedback");
      expect(answerFeedback).toBeInTheDocument();
      
      const playerFeedback = await canvas.findByTestId("player-feedback");
      expect(playerFeedback).toHaveTextContent(/incorrect/i);
      
      // Verify score remains at 0
      const scoreDisplay = await canvas.findByTestId("score-display");
      expect(scoreDisplay).toHaveTextContent("0");
      
      // Verify buzz button is not present for player who answered incorrectly
      const buzzButton = canvas.queryByTestId("buzz-button");
      expect(buzzButton).not.toBeInTheDocument();
    });

    // Switch to second player's view
    await step('Switch to second player view', async () => {
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
      });

      // Remount with second player's session
      await mount(
        <SessionContext.ProviderFromClient client={sessionClient2}>
          <GameContext.ProviderFromClient client={gameClient}>
            <PlayerView />
          </GameContext.ProviderFromClient>
        </SessionContext.ProviderFromClient>
      );
    });

    await step('Verify second player can buzz in', async () => {
      // Second player should see the buzz button
      const buzzButton = canvas.getByRole("button", { name: /buzz/i });
      expect(buzzButton).toBeInTheDocument();
      
      await userEvent.click(buzzButton);

      // Simulate backend adding second player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-2"];
        draft.value = { active: "answerValidation" };
      });

      // Verify second player is now answering
      const yourTurnText = await canvas.findByText(/your turn to answer/i);
      expect(yourTurnText).toBeInTheDocument();
    });

    await step('Simulate correct answer from second player', async () => {
      // Simulate host marking answer as correct
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
        draft.public.players[1].score = 1; // Increment player 2's score
        draft.public.lastAnswerResult = {
          playerId: "player-2",
          playerName: "Player 2",
          correct: true,
        };
        draft.public.currentQuestion = null;
        draft.value = { active: "questionPrep" };
      });

      // Verify correct answer feedback using test IDs
      const answerFeedback = await canvas.findByTestId("answer-feedback");
      expect(answerFeedback).toBeInTheDocument();
      
      const playerFeedback = await canvas.findByTestId("player-feedback");
      expect(playerFeedback).toHaveTextContent(/correct/i);
      
      // Verify score update
      const scoreDisplay = await canvas.findByTestId("score-display");
      expect(scoreDisplay).toHaveTextContent("1");
    });
  },
};

export const BuzzState: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: ["player-456"], // This player is first in queue
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-789", name: "Other Player", score: 0 },
            ],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify the question is still visible
    const question = await canvas.findByTestId("current-question");
    expect(question).toBeInTheDocument();
    expect(question).toHaveTextContent("What is the capital of France?");

    // Verify the "Your turn to answer" message is shown
    const answeringStatus = await canvas.findByTestId("answering-status");
    expect(answeringStatus).toHaveTextContent(/your turn to answer/i);

    // Verify the buzz button is not present
    const buzzButton = canvas.queryByTestId("buzz-button");
    expect(buzzButton).not.toBeInTheDocument();
  },
};

export const QuestionState: Story = {
  parameters: {
    remix: {
      initialPath: "/games/test-game-id",
      routePattern: "/games/:gameId",
      routeId: "routes/games.$gameId",
      loaderData: {
        host: "triviajam.tv",
        deviceType: "mobile",
        accessToken: "test-token",
        payload: {
          snapshot: defaultGameSnapshot,
          checksum: "test-checksum",
        },
      },
    },
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: [], // Empty queue - no one has buzzed yet
            players: [
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-789", name: "Other Player", score: 0 },
            ],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify the question is visible
    const question = await canvas.findByTestId("current-question");
    expect(question).toBeInTheDocument();
    expect(question).toHaveTextContent("What is the capital of France?");

    // Verify the buzz button is available
    const buzzButton = await canvas.findByTestId("buzz-button");
    expect(buzzButton).toBeInTheDocument();
    expect(buzzButton).toBeEnabled();

    // Verify no answering status is shown
    const answeringStatus = canvas.queryByTestId("answering-status");
    expect(answeringStatus).not.toBeInTheDocument();
  },
};

// Add more stories following the same pattern...
