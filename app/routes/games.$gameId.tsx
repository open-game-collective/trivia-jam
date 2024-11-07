import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import { GameProvider } from "~/contexts/game.context";
import type { gameMachine } from "~/game.machine";
import { GameBoard } from "~/screens/GameBoard";
import { PlayerView } from "~/screens/PlayerView";
import { getDeviceType } from "~/utils/deviceType";

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
  const { gameId } = useParams();
  const { host, accessToken, payload, deviceType } =
    useLoaderData<typeof loader>();

  return (
    <GameProvider
      host={host}
      actorId={gameId!}
      accessToken={accessToken}
      checksum={payload.checksum}
      initialSnapshot={payload.snapshot}
    >
      {deviceType === "desktop" ? (
        <GameBoard gameId={gameId!} />
      ) : (
        <PlayerView gameId={gameId!} />
      )}
    </GameProvider>
  );
}
