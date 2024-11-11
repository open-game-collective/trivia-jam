import { createMachineServer } from "actor-kit/worker";
import { gameMachine } from "./game.machine";
import {
  GameClientEventSchema,
  GameInputPropsSchema,
  GameServiceEventSchema,
} from "./game.schemas";

export const Game = createMachineServer({
  machine: gameMachine as any, // todo type this
  schemas: {
    clientEvent: GameClientEventSchema,
    serviceEvent: GameServiceEventSchema,
    inputProps: GameInputPropsSchema,
  },
  options: {
    persisted: true,
  },
});

export type GameServer = InstanceType<typeof Game>;
export default Game;
