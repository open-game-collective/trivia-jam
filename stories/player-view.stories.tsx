import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "@storybook/test";
import { userEvent, within } from "@storybook/testing-library";
import { PlayerView } from "../app/components/player-view";
import { GameContext } from "../app/game.context";
import { SessionContext } from "../app/session.context";
import type { GameMachine } from "../app/game.machine";
import type { SessionMachine } from "../app/session.machine";
import { defaultGameSnapshot, defaultSessionSnapshot, withActorKit } from "./utils";
import { createActorKitMockClient } from "actor-kit/test";

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
            isVisible: true,
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

    await step('Click buzz in button', async () => {
      const buzzButton = canvas.getByRole("button", { name: /buzz/i });
      await userEvent.click(buzzButton);

      // Simulate backend adding player to buzzer queue
      gameClient.produce((draft) => {
        draft.public.buzzerQueue = ["player-456"];
        draft.value = { active: "answerValidation" };
      });
    });

    await step('Verify player is in buzzer queue', async () => {
      const yourTurnText = await canvas.findByText(/your turn to answer/i);
      expect(yourTurnText).toBeInTheDocument();
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
          },
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

// Add more stories following the same pattern...