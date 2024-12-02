import { z } from "zod";

// Input Schema
export const GameInputPropsSchema = z.object({
  hostName: z.string(),
});

// Client Events (things users can do)
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
  z.object({
    type: z.literal("SKIP_QUESTION"),
  }),

  // Player Events
  z.object({
    type: z.literal("JOIN_GAME"),
    playerName: z.string(),
  }),
  z.object({
    type: z.literal("BUZZ_IN"),
  }),

  // Update Settings Event
  z.object({
    type: z.literal("UPDATE_SETTINGS"),
    settings: z.object({
      maxPlayers: z.number().min(2).max(20),
      questionCount: z.number().min(1).max(50),
    }),
  }),

  // Remove Player Event
  z.object({
    type: z.literal("REMOVE_PLAYER"),
    playerId: z.string(),
  }),

  // Only client-side token action
  z.object({
    type: z.literal("SUBMIT_ENTRY_FEE"),
    transactionSignature: z.string(),
  }),

  // Add new service events
  z.object({
    type: z.literal("INITIALIZE_GAME_VAULT"),
    vaultAddress: z.string(),
  }),
  z.object({
    type: z.literal("VERIFY_ENTRY_FEE"),
    playerId: z.string(),
    transactionSignature: z.string(),
  }),
  z.object({
    type: z.literal("REWARDS_DISTRIBUTED"),
    transactions: z.array(z.object({
      playerId: z.string(),
      signature: z.string(),
    })),
  }),
  z.object({
    type: z.literal("SET_HOST_NAME"),
    name: z.string(),
  }),
]);

// Service Events (authoritative responses)
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
  z.object({
    type: z.literal("INITIALIZE_GAME_VAULT"),
    vaultAddress: z.string(),
  }),
  z.object({
    type: z.literal("VERIFY_ENTRY_FEE"),
    playerId: z.string(),
    transactionSignature: z.string(),
  }),
  z.object({
    type: z.literal("ENTRY_FEE_FAILED"),
    playerId: z.string(),
    error: z.string(),
  }),
  z.object({
    type: z.literal("ENTRY_FEE_VERIFIED"),
    playerId: z.string(),
  }),
  z.object({
    type: z.literal("REWARDS_DISTRIBUTED"),
    transactions: z.array(z.object({
      playerId: z.string(),
      amount: z.number(),
      signature: z.string(),
    })),
  }),

  // Add new service events
  z.object({
    type: z.literal("INITIALIZE_GAME_VAULT"),
    vaultAddress: z.string(),
  }),
  z.object({
    type: z.literal("VERIFY_ENTRY_FEE"),
    playerId: z.string(),
    transactionSignature: z.string(),
  }),
  z.object({
    type: z.literal("REWARDS_DISTRIBUTED"),
    transactions: z.array(z.object({
      playerId: z.string(),
      signature: z.string(),
    })),
  }),

  // Token-related service events
  z.object({
    type: z.literal("VAULT_INITIALIZED"),
    vaultAddress: z.string(),
  }),
  z.object({
    type: z.literal("ENTRY_FEE_VERIFIED"),
    playerId: z.string(),
    transactionSignature: z.string(),
  }),
  z.object({
    type: z.literal("ENTRY_FEE_FAILED"),
    playerId: z.string(),
    error: z.string(),
  }),
  z.object({
    type: z.literal("REWARDS_DISTRIBUTED"),
    transactions: z.array(z.object({
      playerId: z.string(),
      amount: z.number(),
      signature: z.string(),
    })),
  }),
]);
