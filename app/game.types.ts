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
  value: number | string;
  timestamp: number;
};

export interface Question {
  id: string;
  text: string;
  correctAnswer: string | number;
  questionType: "numeric" | "multiple-choice";
  options?: string[];
}

export interface PlayerAnswer {
  playerId: string;
  playerName: string;
  value: string | number;
  timestamp: number;
}

export interface PlayerScore {
  playerId: string;
  playerName: string;
  points: number;
  position: number;
  timeTaken: number;
}

export interface QuestionResult {
  questionId: string;
  questionNumber: number;
  answers: PlayerAnswer[];
  scores: PlayerScore[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

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
    answerTimeWindow: number;
  };
  questions: Record<string, Question>;
  questionResults: QuestionResult[];
  questionNumber: number;
  parsingErrorMessage?: string;
};

export type GamePrivateContext = {};

export type GameServerContext = {
  public: GamePublicContext;
  private: Record<string, GamePrivateContext>;
};
