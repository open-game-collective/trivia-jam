import React from "react";
import { createActorKitMockClient } from "actor-kit/test";
import type { GameMachine } from "../app/game.machine";
import { GameContext } from "../app/game.context";
import { SessionContext } from "../app/session.context";
import type { SessionMachine } from "../app/session.machine";
import type { GamePublicContext } from "../app/game.types";
import { StateFrom } from "xstate";
import type { StoryContext } from '@storybook/react';

// Type for game status
type GameStatus = "lobby" | "active" | "finished";

// Type for current question
type CurrentQuestion = {
  text: string;
  isVisible: boolean;
} | null;

// Extend GamePublicContext to allow for different states
type StoryGamePublicContext = Omit<GamePublicContext, "gameStatus" | "currentQuestion" | "winner"> & {
  gameStatus: GameStatus;
  currentQuestion: CurrentQuestion;
  winner: string | null;
};

type GameStateValue = StateFrom<GameMachine>["value"];

export const defaultGameSnapshot = {
  public: {
    id: "test-game-id",
    hostId: "host-123",
    hostName: "Test Host",
    players: [
      { id: "host-123", name: "Test Host", score: 0 },
      { id: "player-456", name: "Test Player", score: 0 },
    ],
    currentQuestion: null,
    buzzerQueue: [] as string[],
    gameStatus: "lobby" as GameStatus,
    winner: null,
    settings: {
      maxPlayers: 10,
      questionCount: 10,
    },
  } satisfies StoryGamePublicContext,
  private: {},
  value: "lobby" as GameStateValue
};

export const defaultSessionSnapshot = {
  public: {
    userId: "test-user-id",
    gameIdsByJoinCode: {},
  },
  private: {},
  value: { Initialization: "Ready" as const }
};

type GameSnapshotOverrides = {
  public?: Partial<StoryGamePublicContext>;
  value?: GameStateValue;
};

// Add return type for the decorator
export type DecoratorClients = {
  gameClient: ReturnType<typeof createActorKitMockClient<GameMachine>>;
  sessionClient: ReturnType<typeof createActorKitMockClient<SessionMachine>>;
};

export function createGameAndSessionDecorator({
  gameSnapshot = defaultGameSnapshot,
  sessionSnapshot = defaultSessionSnapshot,
  userId = "test-user-id",
  gameOverrides = {} as GameSnapshotOverrides,
} = {}) {
  return function StoryDecorator(Story: React.ComponentType, context: StoryContext) {
    // Create mock clients
    const gameMockClient = createActorKitMockClient<GameMachine>({
      initialSnapshot: {
        ...gameSnapshot,
        ...gameOverrides,
        public: {
          ...gameSnapshot.public,
          ...gameOverrides.public,
          hostId: gameOverrides.public?.hostId || gameSnapshot.public.hostId || userId,
        },
        value: gameOverrides.value || gameSnapshot.value,
      },
    });

    const sessionMockClient = createActorKitMockClient<SessionMachine>({
      initialSnapshot: {
        ...sessionSnapshot,
        public: {
          ...sessionSnapshot.public,
          userId,
        },
      },
    });

    // Store clients in context for access in play function
    context.parameters.clients = {
      gameClient: gameMockClient,
      sessionClient: sessionMockClient,
    } satisfies DecoratorClients;

    return (
      <SessionContext.ProviderFromClient client={sessionMockClient}>
        <GameContext.ProviderFromClient client={gameMockClient}>
          <Story />
        </GameContext.ProviderFromClient>
      </SessionContext.ProviderFromClient>
    );
  };
} 