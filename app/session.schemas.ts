import { z } from "zod";

export const SessionClientEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("START_GAME"),
    gameId: z.string(),
  }),
]);


export const SessionServiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SYNC"),
  }),
]);

export const SessionInputPropsSchema = z.object({
  sessionId: z.string(),
});
