import { z } from "zod";

// Input Schema
export const GameInputPropsSchema = z.object({
  hostName: z.string(),
});

// Event Schemas
export const GameClientEventSchema = z.discriminatedUnion("type", [
  // Host Events
  z.object({
    type: z.literal("START_GAME"),
  }),
  z.object({
    type: z.literal("SUBMIT_QUESTION"),
    question: z.string(),
  }),
  z.object({
    type: z.literal("SHOW_QUESTION"),
  }),
  z.object({
    type: z.literal("VALIDATE_ANSWER"),
    playerId: z.string(),
    correct: z.boolean(),
  }),
  z.object({
    type: z.literal("END_GAME"),
  }),

  // Player Events
  z.object({
    type: z.literal("JOIN_GAME"),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal("BUZZ_IN"),
  }),
]);

export const GameServiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SYNC_PLAYERS"),
    players: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        score: z.number(),
      })
    ),
  }),
]);
