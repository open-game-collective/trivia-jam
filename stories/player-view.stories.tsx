import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "@storybook/test";
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
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

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
    (Story) => {
      const network = WalletAdapterNetwork.Devnet;
      const endpoint = clusterApiUrl(network);
      const wallets = [new UnsafeBurnerWalletAdapter()];

      return (
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              <Story />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      );
    },
  ],
} satisfies Meta<typeof PlayerView>;

export default meta;
type Story = StoryObj<typeof meta>;

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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            players: [{ id: "player-456", name: "Test Player", score: 0 }],
          },
          value: { active: "questionActive" },
        },
      },
    },
  },
  play: async ({ mount, step, canvas }) => {
    const gameClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...defaultGameSnapshot,
        public: {
          ...defaultGameSnapshot.public,
          gameStatus: "active",
          currentQuestion: {
            text: "What is the capital of France?",
          },
          players: [{ id: "player-456", name: "Test Player", score: 0 }],
        },
        value: { active: "questionActive" },
      },
    });

    await step("Mount component with initial state", async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step("Click buzz in button", async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      await userEvent.click(buzzButton);

      // Simulate backend adding player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-456"];
        draft.value = { active: "answerValidation" };
      });
    });

    await step("Verify player is in buzzer queue", async () => {
      const answeringStatus = await canvas.findByTestId("answering-status");
      expect(answeringStatus).toHaveTextContent(/your turn to answer/i);
    });

    await step("Simulate correct answer", async () => {
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
              isVisible: true,
            },
            buzzerQueue: ["player-456"],
            lastAnswerResult: {
              playerId: "player-456",
              playerName: "Test Player",
              correct: false,
            },
            players: [{ id: "player-456", name: "Test Player", score: 0 }],
          },
          value: { active: "answerValidation" },
        },
      },
    },
  },
  play: async ({ canvas, mount, step }) => {
    await step("Mount component with initial state", async () => {
      await mount(<PlayerView />);
    });

    await step("Verify incorrect answer feedback", async () => {
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
  play: async ({ canvas, mount, step }) => {
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

    await step("Mount component with initial state", async () => {
      await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step("Enter player name", async () => {
      const nameInput = canvas.getByLabelText(/your name/i);
      await userEvent.type(nameInput, "New Player");
    });

    await step("Submit name", async () => {
      const joinButton = canvas.getByRole("button", { name: /^join game$/i });
      await userEvent.click(joinButton);

      // Verify loading state
      const loadingButton = await canvas.findByRole("button", {
        name: /joining/i,
      });
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

    await step("Verify joined successfully", async () => {
      const welcomeMessage = await canvas.findByText(/welcome, new player!/i);
      expect(welcomeMessage).toBeInTheDocument();
    });
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
            players: [{ id: "player-456", name: "Test Player", score: 1 }],
          },
          value: { active: "questionPrep" },
        },
      },
    },
  },
};

export const AlreadyBuzzedIn: Story = {
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
            currentQuestion: {
              text: "What is the capital of France?",
            },
            buzzerQueue: [], // Empty queue after being removed
            previousAnswers: [
              {
                playerId: "player-456",
                playerName: "Test Player",
                correct: false,
              },
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
  play: async ({ canvas, mount, step }) => {
    await step("Mount component with initial state", async () => {
      await mount(<PlayerView />);
    });

    await step("Verify question is visible", async () => {
      // The question should still be visible
      const question = await canvas.findByText(
        "What is the capital of France?"
      );
      expect(question).toBeInTheDocument();
    });

    await step(
      "Verify buzz button is not present after incorrect answer",
      async () => {
        // The buzz button should not be present since player already answered incorrectly
        const buzzButton = canvas.queryByRole("button", { name: /buzz/i });
        expect(buzzButton).not.toBeInTheDocument();
      }
    );

    await step("Verify incorrect answer feedback", async () => {
      // Should show the incorrect answer feedback
      const feedbackMessage = await canvas.findByText(
        /sorry, that's incorrect/i
      );
      expect(feedbackMessage).toBeInTheDocument();
    });
  },
};

export const QuestionWithBuzzer: Story = {
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
  play: async ({ mount, step, canvas }) => {
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

    await step("Mount component with initial state", async () => {
      const view = await mount(
        <GameContext.ProviderFromClient client={gameClient}>
          <PlayerView />
        </GameContext.ProviderFromClient>
      );
    });

    await step("Verify question is visible", async () => {
      const question = await canvas.findByText(
        "What is the capital of France?"
      );
      expect(question).toBeInTheDocument();
    });

    await step("Verify buzz button is present", async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      expect(buzzButton).toBeInTheDocument();
    });

    await step("Click buzz button", async () => {
      const buzzButton = await canvas.findByTestId("buzz-button");
      await userEvent.click(buzzButton);

      // Simulate backend adding player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-456"];
      });
    });

    await step("Verify player is first in queue", async () => {
      const turnMessage = await canvas.findByText(/your turn to answer/i);
      expect(turnMessage).toBeInTheDocument();
    });
  },
};

export const MultiplePlayersAnswering: Story = {
  parameters: {
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
  play: async ({ canvas, mount, step }) => {
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

    await step("Mount component and first player buzzes in", async () => {
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

    await step("Verify first player is answering", async () => {
      const yourTurnText = await canvas.findByText(/your turn to answer/i);
      expect(yourTurnText).toBeInTheDocument();
    });

    await step("Simulate incorrect answer from first player", async () => {
      // Simulate host marking answer as incorrect
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = [];
        draft.public.lastAnswerResult = {
          playerId: "player-1",
          playerName: "Player 1",
          correct: false,
        };
        draft.public.previousAnswers = [
          {
            playerId: "player-1",
            playerName: "Player 1",
            correct: false,
          },
        ];
        draft.value = { active: "questionActive" };
      });
    });

    await step("Verify incorrect answer feedback", async () => {
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
    await step("Switch to second player view", async () => {
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

    await step("Verify second player can buzz in", async () => {
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

    await step("Simulate correct answer from second player", async () => {
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

export const Lobby: Story = {
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


export const LobbyWithoutWallet: Story = {
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
            entryFee: 100,
            prizePool: 0,
            paidPlayers: [],
          },
        },
      },
    },
  },
};

export const LobbyWithWalletNoBalance: Story = {
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
            entryFee: 100,
            prizePool: 0,
            paidPlayers: [],
          },
        },
      },
    },
  },
};

export const LobbyWithBalance: Story = {
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
            entryFee: 100,
            prizePool: 0,
            paidPlayers: [],
          },
        },
      },
    },
  },
};

export const LobbyAfterPayment: Story = {
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
            entryFee: 100,
            prizePool: 100,
            paidPlayers: ["player-456"],
          },
        },
      },
    },
  },
};

export const LobbyWithMultiplePlayers: Story = {
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
            players: [
              { id: "host-123", name: "Host Player", score: 0 },
              { id: "player-456", name: "Test Player", score: 0 },
              { id: "player-789", name: "Another Player", score: 0 },
            ],
            entryFee: 100,
            prizePool: 200,
            paidPlayers: ["player-456", "host-123"],
          },
        },
      },
    },
  },
};

export const LobbyFull: Story = {
  parameters: {
    actorKit: {
      session: {
        "session-123": {
          ...defaultSessionSnapshot,
          public: {
            ...defaultSessionSnapshot.public,
            userId: "player-5", // We're player-5 in this view
          },
        },
      },
      game: {
        "game-123": {
          ...defaultGameSnapshot,
          public: {
            ...defaultGameSnapshot.public,
            players: [
              { id: "host-1", name: "Game Host", score: 0 },
              { id: "player-2", name: "Alice", score: 0 },
              { id: "player-3", name: "Bob", score: 0 },
              { id: "player-4", name: "Charlie", score: 0 },
              { id: "player-5", name: "You", score: 0 },
              { id: "player-6", name: "David", score: 0 },
              { id: "player-7", name: "Eve", score: 0 },
              { id: "player-8", name: "Frank", score: 0 },
              { id: "player-9", name: "Grace", score: 0 },
              { id: "player-10", name: "Henry", score: 0 },
            ],
            entryFee: 100,
            prizePool: 600, // 6 players have paid
            paidPlayers: [
              "host-1",    // Host has paid
              "player-2",  // Alice paid
              "player-3",  // Bob paid
              "player-5",  // You paid
              "player-7",  // Eve paid
              "player-8",  // Frank paid
            ],
            settings: {
              maxPlayers: 10,
              questionCount: 10,
            },
            gameStatus: "lobby",
          },
          value: { lobby: "waitingForPlayers" },
        },
      },
    },
  },
  play: async ({ mount, canvas, step }) => {
    await step("Mount component", async () => {
      await mount(<PlayerView />);
    });

    await step("Verify player count", async () => {
      // Should show 10/10 players
      const playerCount = await canvas.findByText("6/10");
      expect(playerCount).toBeInTheDocument();
    });

    await step("Verify paid status indicators", async () => {
      // Should show 6 "Entry Paid" indicators
      const paidIndicators = await canvas.findAllByText("Entry Paid");
      expect(paidIndicators).toHaveLength(6);
    });

    await step("Verify prize pool", async () => {
      // Prize pool should be 600 JAM (6 players * 100 JAM)
      const prizePool = await canvas.findByText("Current Prize Pool: 600 JAM");
      expect(prizePool).toBeInTheDocument();
    });

    await step("Verify player list styling", async () => {
      // Paid players should have green background
      const paidPlayerElements = await canvas.findAllByText(/Entry Paid/);
      paidPlayerElements.forEach(element => {
        const parentDiv = element.closest('div');
        expect(parentDiv).toHaveClass('bg-green-500/10');
      });

      // Unpaid players should have gray background
      const unpaidPlayers = ["Charlie", "David", "Grace", "Henry"];
      for (const playerName of unpaidPlayers) {
        const playerElement = await canvas.findByText(playerName);
        const parentDiv = playerElement.closest('div');
        expect(parentDiv).toHaveClass('bg-gray-800/50');
      }
    });
  },
};

// Add more stories following the same pattern...
