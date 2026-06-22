// src/lib/auth.ts
// Authentication utilities: password hashing, JWT sign/verify, session helpers.
//
// Security decisions (per plan security spec S-03):
// - bcryptjs at cost 12 for password hashing.
// - jose HS256 JWT with 256-bit secret; 2h expiry.
// - httpOnly + Secure (prod) + SameSite=Strict cookie named "session".
// - Constant-time-ish: always run bcrypt compare even for unknown users
//   (dummy hash) to prevent user-enumeration via timing.
// - getSession works in both Node.js (NextRequest) and edge (cookies()) contexts.

import * as bcrypt from "bcryptjs";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// ── Constants ─────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "session";

// 2 hours in seconds
const JWT_MAX_AGE_SECONDS = 60 * 60 * 2;

// Cost 12 for bcrypt (matches gen-admin.mjs)
const BCRYPT_COST = 12;

// Dummy hash used for constant-time comparison when user is unknown.
// Pre-computed so we don't hash on every request.
// This is NOT a secret — it's just a stable bcrypt hash of a throwaway string.
const DUMMY_HASH =
  "$2a$12$OxXBgSMneoAGn9LiKXGnGerrAIQ/5LNKaGwXRy5VG.FpnIHUdLJ8C";

// ── Secret helpers ────────────────────────────────────────────────────────────

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  // Use Buffer.from so the result is a true Uint8Array in all environments
  // (jsdom's TextEncoder can return a subclass that fails jose's instanceof check).
  return Uint8Array.from(Buffer.from(secret));
}

// ── Password helpers ──────────────────────────────────────────────────────────

/**
 * Hash a plaintext password with bcrypt (cost 12).
 * Used in gen-admin.mjs; exposed here for tests.
 */
export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_COST);
}

/**
 * Compare plaintext against a stored bcrypt hash.
 * Always returns false for an empty/null hash rather than throwing.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plaintext, hash);
}

// ── JWT sign / verify ─────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  sub: string; // username
}

/**
 * Sign a new session JWT.
 * Payload fields: sub (username), iat (issued-at), exp (2h from now).
 */
export async function signSession(payload: { username: string }): Promise<string> {
  return new SignJWT({ sub: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

/**
 * Verify a JWT and return the decoded payload.
 * Throws if the token is expired, has an invalid signature, or is malformed.
 */
export async function verifySession(token: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, getJwtSecret(), {
    algorithms: ["HS256"],
  });
  return payload as SessionPayload;
}

// ── getSession ────────────────────────────────────────────────────────────────

/**
 * Retrieve and verify the session from:
 *   1. A NextRequest object (middleware / route handlers).
 *   2. The Next.js cookies() store (Server Components / Server Actions).
 *
 * Returns the decoded payload or null on any error (expired, invalid, missing).
 */
export async function getSession(
  req?: NextRequest
): Promise<SessionPayload | null> {
  try {
    let token: string | undefined;

    if (req) {
      // Route handler / middleware path
      token = req.cookies.get(SESSION_COOKIE)?.value;
    } else {
      // Server Component path — next/headers cookies()
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE)?.value;
    }

    if (!token) return null;
    return await verifySession(token);
  } catch {
    return null;
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  path: string;
  maxAge: number;
}

/**
 * Returns the cookie options for the session cookie.
 * Secure=true only in production (allows http in local dev).
 */
export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: JWT_MAX_AGE_SECONDS,
  };
}

// ── Constant-time auth check ──────────────────────────────────────────────────

/**
 * Verify admin credentials in constant-time.
 *
 * Always runs bcrypt.compare — even when the username doesn't match — to
 * prevent user-enumeration via timing differences.
 *
 * Returns true only when both username AND password are correct.
 */
export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const adminUsername = process.env.ADMIN_USERNAME ?? "";
  const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";

  // Always compare against a hash (real or dummy) to keep timing uniform.
  const hashToCompare = adminHash || DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hashToCompare);

  // Only return true when both conditions hold (and real hash was used).
  const usernameOk = adminUsername !== "" && username === adminUsername;
  const hashWasReal = adminHash !== "";

  return usernameOk && hashWasReal && passwordOk;
}
