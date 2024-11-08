import type { ActorServer } from "actor-kit";
import type { Remix } from "../server";
import type { GameServer } from "./game.server";
import type { SessionServer } from "./session.server";

declare module "@remix-run/cloudflare" {
  interface AppLoadContext {
    env: Env;
    userId: string;
    sessionId: string;
    pageSessionId: string;
  }
}

export interface Env {
  REMIX: DurableObjectNamespace<Remix>;
  SESSION: DurableObjectNamespace<SessionServer>;
  GAME: DurableObjectNamespace<GameServer>;
  KV_STORAGE: KVNamespace;
  SESSION_JWT_SECRET: string;
  ACTOR_KIT_SECRET: string;
  ACTOR_KIT_HOST: string;
  NODE_ENV: string;
  [key: string]: DurableObjectNamespace<ActorServer<any>> | unknown;
}
