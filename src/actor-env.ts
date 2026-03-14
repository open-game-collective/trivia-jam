import type { ActorKitEnv } from "actor-kit";
import type { DurableObjectNamespace } from "@cloudflare/workers-types";
import type { SessionServer } from "./session.server";
import type { GameServer } from "./game.server";

export interface ActorEnv extends ActorKitEnv {
  SESSION: DurableObjectNamespace<SessionServer>;
  GAME: DurableObjectNamespace<GameServer>;
  KV_STORAGE: KVNamespace;
  SESSION_JWT_SECRET: string;
  ACTOR_KIT_HOST: string;
  NODE_ENV: string;
  GEMINI_API_KEY: string;
}
