import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { useLoaderData, useParams } from "@remix-run/react";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import { SpectatorView } from "~/components/spectator-view";
import type { gameMachine } from "~/game.machine";
import { GameProvider } from "~/game.context";

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

export default function SpectateRoute() {
  const gameId = useParams().gameId!;
  const { host, accessToken, payload } = useLoaderData<typeof loader>();

  return (
    <GameProvider
      host={host}
      actorId={gameId!}
      accessToken={accessToken}
      checksum={payload.checksum}
      initialSnapshot={payload.snapshot}
    >
      <SpectatorView host={host} />
    </GameProvider>
  );
} 