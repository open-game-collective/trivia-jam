import { z } from "zod";

export const SessionClientEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("START_GAME"),
    gameId: z.string(),
  }),
]);

const RecipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
});

export const SessionServiceEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("SYNC_RECIPES"),
    recipes: z.array(RecipeSchema),
  }),
]);

export const SessionInputPropsSchema = z.object({
  sessionId: z.string(),
});
