/**
 * Subscriber storage for re-engagement notifications.
 * Uses KV to persist ogsDeviceIds of players who opt-in
 * to be notified when a host starts a new game.
 *
 * Key format: `subscribers:${hostId}` → JSON array of ogsDeviceIds
 */

function subscriberKey(hostId: string): string {
  return `subscribers:${hostId}`;
}

export async function getSubscribers(
  kv: KVNamespace,
  hostId: string
): Promise<string[]> {
  const raw = await kv.get(subscriberKey(hostId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addSubscriber(
  kv: KVNamespace,
  hostId: string,
  ogsDeviceId: string
): Promise<void> {
  const subscribers = await getSubscribers(kv, hostId);
  if (subscribers.includes(ogsDeviceId)) return;
  subscribers.push(ogsDeviceId);
  await kv.put(subscriberKey(hostId), JSON.stringify(subscribers));
}

export async function removeSubscriber(
  kv: KVNamespace,
  hostId: string,
  ogsDeviceId: string
): Promise<void> {
  const subscribers = await getSubscribers(kv, hostId);
  const filtered = subscribers.filter((id) => id !== ogsDeviceId);
  await kv.put(subscriberKey(hostId), JSON.stringify(filtered));
}
