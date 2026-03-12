import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { json } from "@remix-run/cloudflare";
import { getSubscribers } from "~/subscribers.server";
import { notifyNewGame } from "~/notifications.server";

/**
 * GET /api/subscribers?hostId=<hostId>
 * Returns the subscriber count for a given host.
 */
export async function loader({ request, context }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const hostId = url.searchParams.get("hostId");

  if (!hostId) {
    return json({ error: "hostId is required" }, { status: 400 });
  }

  const subscribers = await getSubscribers(context.env.KV_STORAGE, hostId);
  return json({ count: subscribers.length });
}

/**
 * POST /api/subscribers
 * Body: { hostId, hostName, gameUrl }
 * Sends push notifications to all subscribers for this host.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json<{
    hostId: string;
    hostName: string;
    gameUrl: string;
  }>();

  if (!body.hostId || !body.hostName || !body.gameUrl) {
    return json(
      { error: "hostId, hostName, and gameUrl are required" },
      { status: 400 }
    );
  }

  const subscribers = await getSubscribers(context.env.KV_STORAGE, body.hostId);

  if (subscribers.length === 0) {
    return json({ sent: 0 });
  }

  await notifyNewGame(
    subscribers,
    body.hostName,
    body.gameUrl,
    context.env.OGS_API_KEY
  );

  return json({ sent: subscribers.length });
}
