/**
 * Server-side notification utilities for sending push notifications
 * to players who have an OGS device ID registered.
 *
 * Uses the OGS Notification API to deliver push notifications
 * to the OGS native app.
 */

const OGS_API_BASE_URL = "https://api.opengame.org";

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface PlayerWithDevice {
  id: string;
  name: string;
  ogsDeviceId?: string;
}

/**
 * Send a push notification to a single OGS device.
 */
async function sendToDevice(
  ogsDeviceId: string,
  notification: NotificationPayload,
  apiKey: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${OGS_API_BASE_URL}/api/v1/notifications/send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          ogsDeviceId,
          notification,
        }),
      }
    );

    if (!response.ok) {
      console.error(
        `[Notifications] Failed to send to device ${ogsDeviceId}:`,
        response.status
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      `[Notifications] Error sending to device ${ogsDeviceId}:`,
      error
    );
    return false;
  }
}

/**
 * Send a push notification to all players who have an OGS device ID.
 * Silently skips players without a device ID.
 */
export async function notifyPlayers(
  players: PlayerWithDevice[],
  notification: NotificationPayload,
  apiKey: string
): Promise<void> {
  const playersWithDevices = players.filter(
    (p): p is PlayerWithDevice & { ogsDeviceId: string } => !!p.ogsDeviceId
  );

  if (playersWithDevices.length === 0) {
    return;
  }

  console.log(
    `[Notifications] Sending "${notification.title}" to ${playersWithDevices.length} device(s)`
  );

  await Promise.allSettled(
    playersWithDevices.map((player) =>
      sendToDevice(player.ogsDeviceId, notification, apiKey)
    )
  );
}

/**
 * Notify all players that the game has started.
 */
export async function notifyGameStarted(
  players: PlayerWithDevice[],
  gameId: string,
  hostName: string,
  apiKey: string
): Promise<void> {
  await notifyPlayers(
    players,
    {
      title: "Game Started!",
      body: `${hostName}'s trivia game is starting now. Get ready!`,
      data: {
        url: `/games/${gameId}`,
        type: "game_started",
        gameId,
      },
    },
    apiKey
  );
}

/**
 * Notify all players that the game has finished with results.
 */
export async function notifyGameFinished(
  players: PlayerWithDevice[],
  gameId: string,
  winnerName: string,
  apiKey: string
): Promise<void> {
  await notifyPlayers(
    players,
    {
      title: "Game Over!",
      body: `${winnerName} won the trivia game! Check the final scores.`,
      data: {
        url: `/games/${gameId}`,
        type: "game_finished",
        gameId,
      },
    },
    apiKey
  );
}
