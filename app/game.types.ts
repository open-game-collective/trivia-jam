import type {
  ActorKitSystemEvent,
  BaseActorKitEvent,
  WithActorKitEvent,
  WithActorKitInput,
} from "actor-kit";
import { z } from "zod";
import { Env } from "./env";
import { GameClientEventSchema, GameServiceEventSchema, GameInputPropsSchema } from "./game.schemas";

export type GameInputProps = z.infer<typeof GameInputPropsSchema>;
export type GameInput = WithActorKitInput<GameInputProps>;

// Event Types
export type GameClientEvent = z.infer<typeof GameClientEventSchema>;
export type GameServiceEvent = z.infer<typeof GameServiceEventSchema>;
export type GameEvent = (
  | WithActorKitEvent<GameClientEvent, "client">
  | WithActorKitEvent<GameServiceEvent, "service">
  | ActorKitSystemEvent
) &
  BaseActorKitEvent<Env>;

// Context Types
export type GamePublicContext = {
  id: string;
  gameCode?: string;
  hostId: string;
  hostName: string;
  players: Array<{
    id: string;
    name: string;
    score: number;
  }>;
  currentQuestion: {
    text: string;
  } | null;
  buzzerQueue: string[]; // Array of player IDs in buzz order
  gameStatus: "lobby" | "active" | "finished";
  winner: string | null;
  settings: {
    maxPlayers: number;
    questionCount: number;
  };
  lastAnswerResult?: {
    playerId: string;
    playerName: string;
    correct: boolean;
  } | null;
  previousAnswers?: Array<{
    playerId: string;
    playerName: string;
    correct: boolean;
  }>;
  questionNumber: number;
  entryFee: number;
  prizePool: number;
  paidPlayers: string[];
  gameVault?: string;
  tokenTransactions: {
    [playerId: string]: {
      entryFeeSignature?: string;
      prizeSignature?: string;
    }
  };
};

export type GamePrivateContext = {
  vaultKeypair?: string; // Store securely
  vaultBump?: number;
};

export type GameServerContext = {
  public: GamePublicContext;
  private: Record<string, GamePrivateContext>;
};
