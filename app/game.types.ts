import type {
  ActorKitSystemEvent,
  BaseActorKitEvent,
  WithActorKitEvent,
  WithActorKitInput,
} from "actor-kit";
import { z } from "zod";
import { Env } from "./env";
import { GameClientEventSchema, GameInputPropsSchema, GameServiceEventSchema } from "./game.schemas";

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
export type Answer = {
  playerId: string;
  playerName: string;
  value: number;
  timestamp: number;
};

export type Question = {
  id: string;
  text: string;
  correctAnswer: number;
  requireExactAnswer: boolean;
};

export type QuestionResult = {
  questionId: string;
  questionNumber: number;
  answers: Answer[];
  scores: Array<{
    playerId: string;
    playerName: string;
    points: number;
    position: number;
    timeTaken: number;
  }>;
};

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
    questionId: string;
    startTime: number;
    answers: Answer[];
  } | null;
  gameStatus: "lobby" | "active" | "finished";
  winner: string | null;
  settings: {
    maxPlayers: number;
    questionCount: number;
    answerTimeWindow: number;
  };
  questions: Record<string, Question>;
  questionResults: QuestionResult[];
  questionNumber: number;
};

export type GamePrivateContext = {};

export type GameServerContext = {
  public: GamePublicContext;
  private: Record<string, GamePrivateContext>;
};
