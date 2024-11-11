import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "@storybook/test";
import { userEvent } from "@storybook/testing-library";
import { HostView } from "../app/components/host-view";
import { GameContext } from "../app/game.context";
import type { GameMachine } from "../app/game.machine";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit } from "./utils";
import { createActorKitMockClient } from "actor-kit/test";

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

export const Docs: Story = {
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
          id: "test-game-id",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
        },
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
      const gameLinkButton = await canvas.findByTestId("game-link-button");
      expect(gameLinkButton).toBeInTheDocument();

      await userEvent.click(gameLinkButton);
      await new Promise(resolve => setTimeout(resolve, 0));

      const successIcon = await canvas.findByTestId("copy-success-icon");
      expect(successIcon).toBeInTheDocument();
    });

    await step('Verify player list and start game', async () => {
      const player1 = await canvas.findByText("Player 1");
      expect(player1).toBeInTheDocument();
      const player2 = await canvas.findByText("Player 2");
      expect(player2).toBeInTheDocument();

      const startButton = canvas.getByRole("button", { name: /start game/i });
      expect(startButton).toBeEnabled();

      await userEvent.click(startButton);
      const loadingSpinner = await canvas.findByTestId("loading-spinner");
      expect(loadingSpinner).toBeInTheDocument();
    });
  },
};

export const QuestionControls: Story = {
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
            players: [
              { id: "player-1", name: "Player 1", score: 0 },
              { id: "player-2", name: "Player 2", score: 0 },
            ],
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
          hostId: "host-123",
          gameStatus: "active",
          players: [
            { id: "player-1", name: "Player 1", score: 0 },
            { id: "player-2", name: "Player 2", score: 0 },
          ],
        },
        value: { active: "questionPrep" },
      },
    });

    await mount(
      <GameContext.ProviderFromClient client={gameClient}>
        <HostView host="dev.triviajam.tv" />
      </GameContext.ProviderFromClient>
    );

    // Enter and submit question
    const questionInput = canvas.getByLabelText(/enter question/i);
    await userEvent.type(questionInput, "What is the capital of France?");
    
    const submitButton = canvas.getByRole("button", { name: /submit question/i });
    await userEvent.click(submitButton);

    // Simulate question being set
    gameClient.produce((draft) => {
      draft.public.currentQuestion = {
        text: "What is the capital of France?",
      };
      draft.value = { active: "questionActive" };
    });

    // Verify question is displayed
    const questionDisplay = await canvas.findByText("What is the capital of France?");
    expect(questionDisplay).toBeInTheDocument();

    // Simulate player buzzing in
    gameClient.produce((draft) => {
      draft.public.buzzerQueue = ["player-1"];
      draft.value = { active: "answerValidation" };
    });

    // Verify answer validation controls
    const currentAnswerer = await canvas.findByTestId("current-answerer-validation");
    expect(currentAnswerer).toHaveTextContent("Player 1");

    const correctButton = await canvas.findByTestId("correct-button");
    const incorrectButton = await canvas.findByTestId("incorrect-button");
    expect(correctButton).toBeInTheDocument();
    expect(incorrectButton).toBeInTheDocument();

    // Test correct answer validation
    await userEvent.click(correctButton);

    // Simulate correct answer result
    gameClient.produce((draft) => {
      draft.public.buzzerQueue = [];
      draft.public.players[0].score = 1;
      draft.public.lastAnswerResult = {
        playerId: "player-1",
        playerName: "Player 1",
        correct: true,
      };
      draft.public.currentQuestion = null;
      draft.value = { active: "questionPrep" };
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
  play: async ({ canvas, mount }) => {
    await mount(<HostView host="dev.triviajam.tv" />);

    // Verify final scores display
    const player1Score = await canvas.findByText("Player 1");
    expect(player1Score).toBeInTheDocument();
    const player1Points = await canvas.findByText("3");
    expect(player1Points).toBeInTheDocument();

    const player2Score = await canvas.findByText("Player 2");
    expect(player2Score).toBeInTheDocument();
    const player2Points = await canvas.findByText("1");
    expect(player2Points).toBeInTheDocument();
  },
}; 