import { jwtVerify, SignJWT } from "jose";
import invariant from "tiny-invariant";

export function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const cookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim().split("="));
    const cookie = cookies.find(([key]) => key === name);
    return cookie ? cookie[1] : undefined;
  }
  return undefined;
}

export async function createSessionToken({
  userId,
  sessionId,
  secret,
}: {
  userId: string;
  sessionId: string;
  secret: string;
}) {
  return await new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setAudience("SESSION")
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(secret));
}

export async function createRefreshToken({
  userId,
  secret,
}: {
  userId: string;
  secret: string;
}) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("360d")
    .setAudience("REFRESH")
    .sign(new TextEncoder().encode(secret));
}

export async function createNewUserSession({ secret }: { secret: string }) {
  const userId = crypto.randomUUID();
  const sessionId = crypto.randomUUID();
  const sessionToken = await createSessionToken({
    userId,
    sessionId,
    secret,
  });
  const refreshToken = await createRefreshToken({
    userId,
    secret,
  });
  return { userId, sessionId, sessionToken, refreshToken };
}

export async function verifyOneTimeToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}) {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    invariant(verified.payload.userId, "Missing userId in token payload");
    // todo verifyt his is the rigth type of token
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

export async function verifySessionToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}) {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    invariant(verified.payload.userId, "Missing userId in token payload");
    invariant(verified.payload.sessionId, "Missing sessionId in token payload");
    // todo verifyt his is the rigth type of token
    return verified.payload as { userId: string; sessionId: string };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}) {
  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    invariant(verified.payload.userId, "Invalid refresh token");
    // todo verifyt his is the rigth type of token
    return verified.payload as { userId: string };
  } catch {
    return null;
  }
}

export async function generateVerificationCode({
  email,
  kv,
}: {
  email: string;
  kv: KVNamespace;
}): Promise<string> {
  // Generate a random 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in KV with 10 minute expiry
  await kv.put(`email-code:${email}`, code, { expirationTtl: 600 });

  return code;
}

export async function verifyCode({
  email,
  code,
  kv,
}: {
  email: string;
  code: string;
  kv: KVNamespace;
}): Promise<boolean> {
  const storedCode = await kv.get(`email-code:${email}`);
  return storedCode === code;
}

export async function getUserIdByEmail(email: string, kv: KVNamespace) {
  return await kv.get(`email:${email}`);
}

export async function linkEmailToUser(
  email: string,
  userId: string,
  kv: KVNamespace
) {
  await kv.put(`email:${email}`, userId);
}

export async function getEmailByUserId(userId: string, kv: KVNamespace) {
  // We'll do a reverse lookup through all email:* keys
  const { keys } = await kv.list({ prefix: "email:" });

  for (const key of keys) {
    const storedUserId = await kv.get(key.name);
    if (storedUserId === userId) {
      // key.name is "email:user@example.com", so we extract the email
      return key.name.replace("email:", "");
    }
  }

  return null;
}
