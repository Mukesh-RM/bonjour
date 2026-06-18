import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ALLOWED_USERNAMES, JwtPayload, SessionUser, Username } from "@/lib/types";

const COOKIE_NAME = "bonjour_session";
const TOKEN_EXPIRY = "7d";

function getSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret || secret.length < 32) {
    return null;
  }
  return new TextEncoder().encode(secret);
}

export function isValidUsername(username: string): username is Username {
  return (ALLOWED_USERNAMES as readonly string[]).includes(username);
}

export async function createToken(user: SessionUser): Promise<string> {
  const secret = getSecret();
  if (!secret) {
    throw new Error("JWT_SECRET must be at least 32 characters");
  }
  return new SignJWT({ username: user.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getSecret();
    if (!secret) return null;
    const { payload } = await jwtVerify(token, secret);
    const username = payload.username as string;
    if (!isValidUsername(username) || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      username,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return { id: payload.sub, username: payload.username };
}

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return { id: payload.sub, username: payload.username };
}

export function getCookieName(): string {
  return COOKIE_NAME;
}

export function getCookieOptions(maxAge = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function getOtherUsername(username: Username): Username {
  return username === "user1" ? "user2" : "user1";
}
