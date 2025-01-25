import { createRequestHandler, logDevReady } from "@remix-run/cloudflare";
import * as build from "@remix-run/dev/server-build";
import { DurableObject } from "cloudflare:workers";
import {
  REFRESH_TOKEN_COOKIE_KEY,
  SESSION_TOKEN_COOKIE_KEY,
} from "./constants";
import type { Env } from "./env";
import {
  createNewUserSession,
  createRefreshToken,
  createSessionToken,
  getCookie,
  verifyOneTimeToken,
  verifySessionToken,
} from "./utils";

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

const handleRemixRequest = createRequestHandler(build);

export class Remix extends DurableObject<Env> {
  async fetch(request: Request) {
    let userId: string;
    let sessionId: string;
    let pageSessionId: string;
    let oneTimeToken: string | undefined;
    let sessionToken: string | undefined;
    let newRefreshToken: string | undefined;

    const accessToken = getCookie(request, SESSION_TOKEN_COOKIE_KEY);
    const refreshToken = getCookie(request, REFRESH_TOKEN_COOKIE_KEY);

    if (oneTimeToken) {
      const payload = await verifyOneTimeToken({
        token: oneTimeToken,
        secret: this.env.SESSION_JWT_SECRET,
      });
      if (payload) {
        userId = payload.userId;
        sessionId = crypto.randomUUID();
        sessionToken = await createSessionToken({
          userId,
          sessionId,
          secret: this.env.SESSION_JWT_SECRET,
        });
        newRefreshToken = await createRefreshToken({
          userId,
          secret: this.env.SESSION_JWT_SECRET,
        });
      } else {
        const newSession = await createNewUserSession({
          secret: this.env.SESSION_JWT_SECRET,
        });
        userId = newSession.userId;
        sessionId = newSession.sessionId;
        sessionToken = newSession.sessionToken;
        newRefreshToken = newSession.refreshToken;
      }
    } else if (accessToken) {
      const payload = await verifySessionToken({
        token: accessToken,
        secret: this.env.SESSION_JWT_SECRET,
      });
      if (payload) {
        userId = payload.userId;
        sessionId = payload.sessionId;
      } else {
        const newSession = await createNewUserSession({
          secret: this.env.SESSION_JWT_SECRET,
        });
        userId = newSession.userId;
        sessionId = newSession.sessionId;
        sessionToken = newSession.sessionToken;
        newRefreshToken = newSession.refreshToken;
      }
    } else if (refreshToken) {
      const payload = await verifySessionToken({
        token: refreshToken,
        secret: this.env.SESSION_JWT_SECRET,
      });
      if (payload) {
        userId = payload.userId;
        sessionId = crypto.randomUUID();
        sessionToken = await createSessionToken({
          userId,
          sessionId,
          secret: this.env.SESSION_JWT_SECRET,
        });
        newRefreshToken = await createRefreshToken({
          userId,
          secret: this.env.SESSION_JWT_SECRET,
        });
      } else {
        const newSession = await createNewUserSession({
          secret: this.env.SESSION_JWT_SECRET,
        });
        userId = newSession.userId;
        sessionId = newSession.sessionId;
        sessionToken = newSession.sessionToken;
        newRefreshToken = newSession.refreshToken;
      }
    } else {
      const newSession = await createNewUserSession({
        secret: this.env.SESSION_JWT_SECRET,
      });
      userId = newSession.userId;
      sessionId = newSession.sessionId;
      sessionToken = newSession.sessionToken;
      newRefreshToken = newSession.refreshToken;
    }

    pageSessionId = crypto.randomUUID();

    const response = await handleRemixRequest(request, {
      env: this.env,
      userId,
      sessionId,
      pageSessionId,
    });

    if (sessionToken) {
      response.headers.append(
        "Set-Cookie",
        `${SESSION_TOKEN_COOKIE_KEY}=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=900; Path=/`
      );
    }
    if (newRefreshToken) {
      response.headers.append(
        "Set-Cookie",
        `${REFRESH_TOKEN_COOKIE_KEY}=${newRefreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/`
      );
    }

    return response;
  }
}
