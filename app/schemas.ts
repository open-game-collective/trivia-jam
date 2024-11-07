import { z } from "zod";

export const StartGameEventSchema = z.object({
  type: z.literal("START_GAME"),
  id: z.string(),
});
