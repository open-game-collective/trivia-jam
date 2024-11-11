import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, waitFor, fn } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { HostView } from "../app/components/host-view";
import { GameContext } from "../app/game.context";
import { SessionContext } from "../app/session.context";
import type { GameMachine } from "../app/game.machine";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit } from "./utils";
import { createActorKitMockClient } from "actor-kit/test";

const meta = {
  title: "Views/HostView",
  component: HostView,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    host: "triviajam.tv"
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
type Story = StoryObj<typeof meta>;

export const InLobby: Story = {
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
          },
        },
      },
    },
  },
};

export const StartingGame: Story = {
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
          },
          value: { lobby: "ready" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step, args }) => {
    const canvas = within(canvasElement);
    
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
        },
        value: { lobby: "ready" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <HostView host={args.host} />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Verify start button is enabled', async () => {
      const startButton = canvas.getByRole('button', { name: /start game$/i });
      expect(startButton).toBeEnabled();
      await userEvent.click(startButton);
    });

    await step('Verify loading state', async () => {
      const loadingText = await canvas.findByText(/starting game/i);
      expect(loadingText).toBeInTheDocument();
      
      const loadingSpinner = canvas.getByTestId('loading-spinner');
      expect(loadingSpinner).toBeInTheDocument();
      
      const startButton = canvas.getByRole('button', { name: /starting game/i });
      expect(startButton).toBeDisabled();
    });

    await step('Simulate game starting', async () => {
      gameClient.produce((draft) => {
        draft.public.gameStatus = "active";
        draft.value = { active: "questionPrep" };
      });

      await waitFor(() => {
        expect(canvas.queryByText(/starting game/i)).not.toBeInTheDocument();
      });
    });
  },
};

export const AskingQuestion: Story = {
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
            gameStatus: "active",
            currentQuestion: null,
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step, args }) => {
    const canvas = within(canvasElement);

    // Create game client to manipulate state
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          hostId: "host-123",
          gameStatus: "active",
          currentQuestion: null,
        },
        value: { active: "questionPrep" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <HostView host={args.host} />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Enter and submit question', async () => {
      // Find the textarea by its label text
      const questionInput = canvas.getByRole('textbox', { name: /enter question/i });
      await userEvent.type(questionInput, "What is the capital of France?");
      
      // Find and click the submit button
      const submitButton = canvas.getByRole("button", { name: /submit question/i });
      await userEvent.click(submitButton);

      // Simulate question being submitted
      gameClient.produce((draft) => {
        draft.public.currentQuestion = {
          text: "What is the capital of France?",
        };
      });
    });

    await step('Verify question was submitted', async () => {
      // Verify the question is displayed
      const questionDisplay = await canvas.findByText("What is the capital of France?");
      expect(questionDisplay).toBeInTheDocument();

      // Verify the skip button is available
      const skipButton = await canvas.findByRole("button", { name: /skip/i });
      expect(skipButton).toBeInTheDocument();
    });
  },
};

export const ValidatingAnswer: Story = {
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
            gameStatus: "active",
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: ["player-456"],
            players: [
              { id: "host-123", name: "Test Host", score: 0 },
              { id: "player-456", name: "Test Player", score: 0 },
            ],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step, args }) => {
    const canvas = within(canvasElement);
    
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          hostId: "host-123",
          gameStatus: "active",
          currentQuestion: {
            text: "What is the capital of France?",
          },
          buzzerQueue: ["player-456"],
          players: [
            { id: "host-123", name: "Test Host", score: 0 },
            { id: "player-456", name: "Test Player", score: 0 },
          ],
        },
        value: { active: "answerValidation" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <HostView host={args.host} />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Verify initial validation state', async () => {
      // Find the section containing both the player name and "is answering" text
      const answerSection = canvas.getByText("Current Answer").parentElement;
      expect(answerSection).toBeInTheDocument();
      
      // Check that both pieces of text are in this section
      expect(answerSection).toHaveTextContent("Test Player");
      expect(answerSection).toHaveTextContent("is answering");

      // Verify correct/incorrect buttons are present
      expect(canvas.getByTestId("correct-button")).toBeInTheDocument();
      expect(canvas.getByTestId("incorrect-button")).toBeInTheDocument();
    });

    await step('Mark answer as correct', async () => {
      // Find the correct button by its test ID
      const correctButton = canvas.getByTestId("correct-button");
      await userEvent.click(correctButton);

      // Simulate answer being marked correct
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
        draft.public.players[1].score += 1; // Increment player's score
        draft.value = { active: "questionPrep" }; // Return to question prep
      });
    });

    await step('Verify state after correct answer', async () => {
      // Verify we're back to question prep state
      await waitFor(() => {
        expect(canvas.queryByText(/is answering/i)).not.toBeInTheDocument();
      });

      // Verify score was updated
      expect(canvas.getByText("1")).toBeInTheDocument(); // Player's new score
    });
  },
};

export const InLobbyNoPlayers: Story = {
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
            players: [],
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify start button is disabled
    const startButton = canvas.getByRole('button', { name: /start game/i });
    expect(startButton).toBeDisabled();
    
    // Verify waiting message
    const waitingMessage = await canvas.findByText(/waiting for at least one player/i);
    expect(waitingMessage).toBeInTheDocument();
  },
};

export const InLobbyWithPlayers: Story = {
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
              { id: "host-123", name: "Test Host", score: 0 },
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
          },
          value: { lobby: "ready" },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify start button is enabled with enough players
    const startButton = canvas.getByRole('button', { name: /start game$/i });
    expect(startButton).toBeEnabled();

    // Verify player list
    const player1 = await canvas.findByText("Player 1");
    expect(player1).toBeInTheDocument();
    const player2 = await canvas.findByText("Player 2");
    expect(player2).toBeInTheDocument();

    // Verify empty slots
    const emptySlots = await canvas.findAllByText("Empty Slot");
    expect(emptySlots).toHaveLength(7); // 10 total slots - 3 players = 7 empty slots
  },
};

export const CopyGameCode: Story = {
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
            id: "test-game-id",
            hostId: "host-123",
            players: [],
          },
        },
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const writeText = fn();
    
    await step('Setup clipboard mock', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true
      });
    });
    
    await step('Copy game link', async () => {
      // Find the game link container by test ID
      const gameLinkButton = await canvas.findByTestId("game-link-button");
      await userEvent.click(gameLinkButton);
      
      // Verify clipboard was called with the full URL
      expect(writeText).toHaveBeenCalledWith("https://triviajam.tv/games/test-game-id");
    });
    
    await step('Verify copy feedback', async () => {
      // Check for the check icon after copying
      const checkIcon = await canvas.findByTestId("copy-success-icon");
      expect(checkIcon).toBeInTheDocument();
    });
  },
};

export const NonHostAccess: Story = {
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
            hostId: "host-456",
            players: [
              { id: "player-123", name: "Regular Player", score: 0 },
            ],
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify access denied message is shown
    const accessDenied = await canvas.findByText(/host controls not available/i);
    expect(accessDenied).toBeInTheDocument();
    
    // Verify explanation is shown
    const explanation = await canvas.findByText(/only the host can access these controls/i);
    expect(explanation).toBeInTheDocument();
    
    // Verify host controls are not shown
    const startButton = canvas.queryByRole('button', { name: /start game/i });
    expect(startButton).not.toBeInTheDocument();
  },
};

export const QuestionInput: Story = {
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
            gameStatus: "active",
            currentQuestion: null,
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
  play: async ({ canvasElement, mount, step, args }) => {
    const canvas = within(canvasElement);

    // Create game client to manipulate state
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          hostId: "host-123",
          gameStatus: "active",
          currentQuestion: null,
        },
        value: { active: "questionPrep" },
      },
    });

    await step('Mount component with initial state', async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <HostView host={args.host} />
        </GameContext.ProviderFromClient>
      );
    });

    await step('Enter and submit question', async () => {
      // Find the textarea by its label text
      const questionInput = canvas.getByRole('textbox', { name: /enter question/i });
      await userEvent.type(questionInput, "What is the capital of France?");
      
      // Find and click the submit button
      const submitButton = canvas.getByRole("button", { name: /submit question/i });
      await userEvent.click(submitButton);

      // Simulate question being submitted
      gameClient.produce((draft) => {
        draft.public.currentQuestion = {
          text: "What is the capital of France?",
        };
      });
    });

    await step('Verify question was submitted', async () => {
      // Verify the question is displayed
      const questionDisplay = await canvas.findByText("What is the capital of France?");
      expect(questionDisplay).toBeInTheDocument();

      // Verify the skip button is available
      const skipButton = await canvas.findByRole("button", { name: /skip/i });
      expect(skipButton).toBeInTheDocument();
    });
  },
};

/**
 * Story showing the loading state when game code hasn't been set yet
 */
export const LoadingGameCode: Story = {
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
            id: undefined, // Set game code to undefined to trigger loading state
            gameCode: undefined,
            players: [],
          },
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify loading message is shown
    const loadingMessage = await canvas.findByText(/creating game/i);
    expect(loadingMessage).toBeInTheDocument();
    
    // Verify loading spinner is present
    const loadingSpinner = canvas.getByRole("status");
    expect(loadingSpinner).toBeInTheDocument();
    
    // Verify game controls are not shown
    const startButton = canvas.queryByRole('button', { name: /start game/i });
    expect(startButton).not.toBeInTheDocument();
  },
}; 