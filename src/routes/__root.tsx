import type { ReactNode } from "react";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { createAccessToken, createActorFetch } from "actor-kit/server";
import type { SessionMachine } from "../session.machine";
import { bridge, BridgeContext } from "../bridge/client";
import { SessionProvider } from "../session.context";
import { getServerEnv, tryGetActorRuntimeEnv } from "../server-env";
import type { Caller } from "actor-kit";
import appCss from "../styles.css?url";

const loadSession = createServerFn({ method: "GET" }).handler(async () => {
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
    actorId: session.sessionId,
    actorType: "session",
    callerId: caller.id,
    callerType: caller.type,
  });

  const runtimeEnv = tryGetActorRuntimeEnv();

  const payload = runtimeEnv
    ? await getSessionSnapshotFromRuntimeEnv(
        runtimeEnv,
        session.sessionId,
        caller
      )
    : await getSessionSnapshotFromHost(
        env.ACTOR_KIT_HOST,
        session.sessionId,
        accessToken
      );

  // Collect cookies to set
  const cookies = globalThis.__sessionCookies__;

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    accessToken,
    payload,
    host: env.ACTOR_KIT_HOST,
    cookies,
  };
});

async function getSessionSnapshotFromHost(
  host: string,
  sessionId: string,
  accessToken: string
) {
  const fetchSession = createActorFetch<SessionMachine>({
    actorType: "session",
    host,
  });
  return fetchSession({ actorId: sessionId, accessToken });
}

async function getSessionSnapshotFromRuntimeEnv(
  runtimeEnv: NonNullable<ReturnType<typeof tryGetActorRuntimeEnv>>,
  sessionId: string,
  caller: Caller
) {
  const durableObjectId = runtimeEnv.SESSION.idFromName(sessionId);
  const durableObject = runtimeEnv.SESSION.get(durableObjectId) as {
    spawn: (props: {
      actorType: string;
      actorId: string;
      caller: Caller;
      input: Record<string, unknown>;
    }) => Promise<void>;
    getSnapshot: (caller: Caller) => Promise<{
      snapshot: Awaited<
        ReturnType<ReturnType<typeof createActorFetch<SessionMachine>>>
      >["snapshot"];
      checksum: string;
    }>;
  };

  await durableObject.spawn({
    actorType: "session",
    actorId: sessionId,
    caller,
    input: {},
  });

  return durableObject.getSnapshot(caller);
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Trivia Jam",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    ],
  }),
  loader: async () => loadSession(),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { host, sessionId, accessToken, payload } = Route.useLoaderData();

  return (
    <BridgeContext.Provider bridge={bridge}>
      <SessionProvider
        host={host}
        actorId={sessionId}
        checksum={payload.checksum}
        accessToken={accessToken}
        initialSnapshot={payload.snapshot}
      >
        <Outlet />
      </SessionProvider>
    </BridgeContext.Provider>
  );
}
