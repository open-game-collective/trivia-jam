import {
  json,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { createAccessToken, createActorFetch } from "actor-kit/server";

import { SessionProvider } from "./session.context";
import { SessionMachine } from "./session.machine";
import styles from "./styles.css";
import { useMemo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
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
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const fetchSession = createActorFetch<SessionMachine>({
    actorType: "session",
    host: context.env.ACTOR_KIT_HOST,
  });

  const accessToken = await createAccessToken({
    signingKey: context.env.ACTOR_KIT_SECRET,
    actorId: context.sessionId,
    actorType: "session",
    callerId: context.userId,
    callerType: "client",
  });
  const payload = await fetchSession({
    actorId: context.sessionId,
    accessToken,
    input: {
      url: request.url,
    },
  });

  // TODO fetch the session here....
  return json({
    sessionId: context.sessionId,
    accessToken,
    payload,
    host: context.env.ACTOR_KIT_HOST,
    NODE_ENV: context.env.NODE_ENV,
  });
}

export default function App() {
  const { NODE_ENV, host, sessionId, accessToken, payload } =
    useLoaderData<typeof loader>();
  const isDevelopment = NODE_ENV === "development";

  // Set up network
  const network = WalletAdapterNetwork.Devnet; // or .Mainnet for production
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Set up wallet adapters
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [network]
  );

  return (
    <>
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body>
          <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
              <WalletModalProvider>
                <SessionProvider
                  host={host}
                  actorId={sessionId}
                  checksum={payload.checksum}
                  accessToken={accessToken}
                  initialSnapshot={payload.snapshot}
                >
                  <Outlet />
                </SessionProvider>
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
          <ScrollRestoration />
          <Scripts />
          {isDevelopment && <LiveReload />}
        </body>
      </html>
    </>
  );
}
