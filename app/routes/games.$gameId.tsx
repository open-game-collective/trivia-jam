import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import { HostView } from "~/components/host-view";
import { PlayerView } from "~/components/player-view";
import type { gameMachine } from "~/game.machine";
import { SessionContext } from "~/session.context";
import { GameProvider } from "../game.context";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
  const fetchGame = createActorFetch<typeof gameMachine>({
    actorType: "game",
    host: context.env.ACTOR_KIT_HOST,
  });

  const accessToken = await createAccessToken({
    signingKey: context.env.ACTOR_KIT_SECRET,
    actorId: params.gameId!,
    actorType: "game",
    callerId: context.userId,
    callerType: "client",
  });

  const payload = await fetchGame({
    actorId: params.gameId!,
    accessToken,
  });

  return json({
    accessToken,
    payload,
    host: context.env.ACTOR_KIT_HOST,
  });
}

export default function GameRoute() {
  const gameId = useParams().gameId!;
  const { host, accessToken, payload } = useLoaderData<typeof loader>();
  const hostId = payload.snapshot.public.hostId;
  const userId = SessionContext.useSelector((state) => state.public.userId);

  return (
    <GameProvider
      host={host}
      actorId={gameId!}
      accessToken={accessToken}
      checksum={payload.checksum}
      initialSnapshot={payload.snapshot}
    >
      {hostId === userId ? <HostView host={host} /> : <PlayerView />}
    </GameProvider>
  );
}
