import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import type { Caller } from "actor-kit";
import { z } from "zod";
import { HostView } from "~/components/host-view";
import { PlayerView } from "~/components/player-view";
import type { gameMachine } from "~/game.machine";
import { SessionContext } from "~/session.context";
import { GameProvider } from "~/game.context";
import { getServerEnv, tryGetActorRuntimeEnv } from "../server-env";

const GameRouteInputSchema = z.object({
  gameId: z.string().min(1),
});

const loadGameRoute = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => GameRouteInputSchema.parse(input))
  .handler(async ({ data }) => {
    const env = getServerEnv();
    const session = globalThis.__session__;
    if (!session) {
      throw new Error("Session not initialized");
    }

    const caller: Caller = {
      id: session.userId,
      type: "client",
    };

    const accessToken = await createAccessToken({
      signingKey: env.ACTOR_KIT_SECRET,
      actorId: data.gameId,
      actorType: "game",
      callerId: caller.id,
      callerType: caller.type,
    });

    const runtimeEnv = tryGetActorRuntimeEnv();

    const payload = runtimeEnv
      ? await getGameSnapshotFromRuntimeEnv(runtimeEnv, data.gameId, caller)
      : await getGameSnapshotFromHost(
          env.ACTOR_KIT_HOST,
          data.gameId,
          accessToken
        );

    return {
      accessToken,
      payload,
      host: env.ACTOR_KIT_HOST,
    };
  });

async function getGameSnapshotFromHost(
  host: string,
  gameId: string,
  accessToken: string
) {
  const fetchGame = createActorFetch<typeof gameMachine>({
    actorType: "game",
    host,
  });
  return fetchGame({ actorId: gameId, accessToken });
}

async function getGameSnapshotFromRuntimeEnv(
  runtimeEnv: NonNullable<ReturnType<typeof tryGetActorRuntimeEnv>>,
  gameId: string,
  caller: Caller
) {
  const durableObjectId = runtimeEnv.GAME.idFromName(gameId);
  const durableObject = runtimeEnv.GAME.get(durableObjectId) as {
    spawn: (props: {
      actorType: string;
      actorId: string;
      caller: Caller;
      input: Record<string, unknown>;
    }) => Promise<void>;
    getSnapshot: (caller: Caller) => Promise<{
      snapshot: Awaited<
        ReturnType<ReturnType<typeof createActorFetch<typeof gameMachine>>>
      >["snapshot"];
      checksum: string;
    }>;
  };

  await durableObject.spawn({
    actorType: "game",
    actorId: gameId,
    caller,
    input: {},
  });

  return durableObject.getSnapshot(caller);
}

export const Route = createFileRoute("/games/$gameId")({
  loader: async ({ params }) => loadGameRoute({ data: params }),
  component: GameRouteComponent,
});

function GameRouteComponent() {
  const { host, accessToken, payload } = Route.useLoaderData();
  const { gameId } = Route.useParams();
  const hostId = payload.snapshot.public.hostId;
  const userId = SessionContext.useSelector((state) => state.public.userId);

  return (
    <GameProvider
      host={host}
      actorId={gameId}
      accessToken={accessToken}
      checksum={payload.checksum}
      initialSnapshot={payload.snapshot}
    >
      {hostId === userId ? <HostView host={host} /> : <PlayerView />}
    </GameProvider>
  );
}
