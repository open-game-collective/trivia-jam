import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import { HostView } from "~/components/host-view";
import { PlayerView } from "~/components/player-view";
import { SpectatorView } from "~/components/spectator-view";
import type { gameMachine } from "~/game.machine";
import { SessionContext } from "~/session.context";
import { GameProvider } from "../game.context";
import { getDeviceType } from "../utils/deviceType";

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

  const deviceType = getDeviceType(request.headers.get("user-agent"));

  return json({
    accessToken,
    payload,
    host: context.env.ACTOR_KIT_HOST,
    deviceType,
  });
}

export default function GameRoute() {
  const gameId = useParams().gameId!;
  const { host, accessToken, payload, deviceType } =
    useLoaderData<typeof loader>();
  const hostId = payload.snapshot.public.hostId;
  const userId = SessionContext.useSelector((state) => state.public.userId);
  console.log({ hostId, userId });

  return (
    <GameProvider
      host={host}
      actorId={gameId!}
      accessToken={accessToken}
      checksum={payload.checksum}
      initialSnapshot={payload.snapshot}
    >
      {deviceType !== "mobile" ? (
        <SpectatorView />
      ) : hostId === userId ? (
        <HostView />
      ) : (
        <PlayerView />
      )}
    </GameProvider>
  );
}
