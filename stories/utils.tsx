import { createRemixStub } from "@remix-run/testing";
import type { StoryContext, StoryFn } from "@storybook/react";
import { CallerSnapshotFrom } from "actor-kit";
import React from "react";
import type { GameMachine } from "../app/game.machine";
import { SessionMachine } from "../app/session.machine";
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { Decorator } from "@storybook/react";
import { useMemo } from "react";

// Import wallet styles
import '@solana/wallet-adapter-react-ui/styles.css';

export const defaultGameSnapshot = {
  public: {
    id: "test-game-id",
    gameCode: "TEST123",
    hostId: "host-123",
    hostName: "Test Host",
    players: [
      { id: "host-123", name: "Test Host", score: 0 },
      { id: "player-456", name: "Test Player", score: 0 },
    ],
    currentQuestion: null,
    buzzerQueue: [],
    gameStatus: "lobby" as const,
    winner: null,
    settings: {
      maxPlayers: 10,
      questionCount: 10,
    },
    questionNumber: 0,
    entryFee: 100,
    prizePool: 0,
    paidPlayers: [],
    tokenTransactions: {},
    gameVault: undefined,
  },
  private: {
    vaultKeypair: undefined,
    vaultBump: undefined,
  },
  value: { 
    lobby: "initializingVault" as const 
  },
} satisfies CallerSnapshotFrom<GameMachine>;

export const defaultSessionSnapshot = {
  public: {
    userId: "test-user-id",
    gameIdsByJoinCode: {},
  },
  private: {},
  value: { Initialization: "Ready" as const },
} satisfies CallerSnapshotFrom<SessionMachine>;

interface Route {
  path: string;
  Component: React.ComponentType<any>;
}

/**
 * Configuration interface for Remix environment in Storybook stories.
 *
 * @template TLoader - Type of the loader data returned by the route
 *
 * @example
 * ```tsx
 * parameters: {
 *   remix: {
 *     initialPath: "/game/123",
 *     loaderData: { gameId: "123" },
 *     routes: [
 *       { path: "/game/:id", Component: GameView }
 *     ],
 *     userId: "user-123"
 *   }
 * }
 * ```
 */
export interface RemixParameters<TLoader> {
  remix: {
    /** Initial URL path for the story */
    initialPath: string;
    /** Mock data that would be returned by the loader */
    loaderData: TLoader;
    /** Route path pattern (e.g., "/games/:gameId") */
    routePattern?: string;
    /** Route ID for hydration (e.g., "routes/games.$gameId") */
    routeId?: string;
    /** Additional routes to register in the Remix environment */
    routes?: Route[];
    /** Mock user ID for authentication */
    userId?: string;
    /** Mock session ID */
    sessionId?: string;
    /** Mock page session ID */
    pageSessionId?: string;
  };
}

interface Route {
  path: string;
  Component: React.ComponentType<any>;
}

/**
 * Storybook decorator that creates a mock Remix environment.
 * Required for components that use Remix hooks or utilities.
 *
 * @template TLoader - Type of the loader data
 *
 * @example
 * ```tsx
 * // In your story file:
 * const meta: Meta = {
 *   decorators: [withRemix<LoaderData>()]
 * };
 *
 * // In each story:
 * export const Default: Story = {
 *   parameters: {
 *     remix: {
 *       initialPath: "/",
 *       loaderData: { someData: "value" }
 *     }
 *   }
 * };
 * ```
 */
export const withRemix = <TLoader extends Record<string, unknown>>() => {
  return (Story: StoryFn, context: StoryContext) => {
    const remixParams = context.parameters
      ?.remix as RemixParameters<TLoader>["remix"];

    if (!remixParams) {
      throw new Error(
        "Remix parameters are required. Add them to your story parameters."
      );
    }

    const RemixStub = createRemixStub(
      [
        {
          id: "root",
          path: "/",
          loader: () => remixParams.loaderData,
          Component: Story,
        },
        ...(remixParams.routes || []),
      ],
      {
        env: {} as any,
        userId: remixParams.userId || "test-user-id",
        sessionId: remixParams.sessionId || "test-session-id",
        pageSessionId: remixParams.pageSessionId || "test-page-session-id",
      }
    );

    return (
      <RemixStub
        initialEntries={[remixParams.initialPath]}
        hydrationData={{
          loaderData: {
            root: remixParams.loaderData,
          },
        }}
      />
    );
  };
};

export const withSolana: Decorator = (Story, context) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Story {...context} />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
