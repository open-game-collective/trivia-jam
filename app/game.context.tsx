"use client";

import { createActorKitContext } from "actor-kit/react";
import type { gameMachine } from "~/game.machine";
import { useSolana } from './contexts/solana.context';

export const GameContext = createActorKitContext<typeof gameMachine>("game");
export const GameProvider = GameContext.Provider; 