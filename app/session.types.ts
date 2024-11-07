import type {
  ActorKitSystemEvent,
  BaseActorKitEvent,
  WithActorKitEvent,
  WithActorKitInput,
} from "actor-kit";
import { z } from "zod";
import {
  SessionClientEventSchema,
  SessionInputPropsSchema,
  SessionServiceEventSchema,
} from "./session.schemas";

export type SessionClientEvent = z.infer<typeof SessionClientEventSchema>;
export type SessionServiceEvent = z.infer<typeof SessionServiceEventSchema>;
export type SessionInput = WithActorKitInput<
  z.infer<typeof SessionInputPropsSchema>
>;

type SessionPublicContext = {
  userId: string;
};

type SessionPrivateContext = {
  gameIds: string[];
};

export type SessionServerContext = {
  public: SessionPublicContext;
  private: Record<string, SessionPrivateContext>;
};

export type SessionEvent = (
  | WithActorKitEvent<SessionClientEvent, "client">
  | WithActorKitEvent<SessionServiceEvent, "service">
  | ActorKitSystemEvent
) &
  BaseActorKitEvent;
