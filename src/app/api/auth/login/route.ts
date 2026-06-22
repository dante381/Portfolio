// src/app/api/auth/login/route.ts
// POST /api/auth/login — authenticate admin and issue session cookie.
//
// Security: (plan spec S-03, S-08)
// - zod-validated body (strict, length caps).
// - Rate-limited: 5 attempts / 15 min per IP.
// - Origin/Referer same-site check.
// - Constant-time credential verification (bcrypt always runs).
// - Generic error — no "user not found" vs "wrong password" distinction.
// - Small fixed delay on failure (prevents rapid probing even if rate limit is bypassed).
// - httpOnly + SameSite=Strict cookie; Secure only in production.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { loginPayloadSchema } from "@/lib/validation";
import { authLimit } from "@/lib/ratelimit";
import {
  verifyAdminCredentials,
  signSession,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

// ── Same-origin check ─────────────────────────────────────────────────────────

function isSameOrigin(req: NextRequest): boolean {
  const reqHost = req.headers.get("host") ?? "";
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const source = origin ?? referer;
  if (!source) {
    // No origin/referer — allow in local dev; reject in production.
    return process.env.NODE_ENV !== "production";
  }

  try {
    const url = new URL(source);
    return url.host === reqHost;
  } catch {
    return false;
  }
}

// ── Generic error response ────────────────────────────────────────────────────

const GENERIC_401 = NextResponse.json(
  { error: "Invalid credentials" },
  { status: 401 }
);

// Fixed delay on failure: 300ms. Slows brute force even if rate limit is bypassed.
async function failWithDelay(): Promise<NextResponse> {
  await new Promise((r) => setTimeout(r, 300));
  return GENERIC_401;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Origin / Referer same-site check
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2. Rate-limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const rl = await authLimit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Try again later." },
      { status: 429 }
    );
  }

  // 3. Parse + validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { username, password } = parsed.data;

  // 4. Verify credentials (constant-time)
  const ok = await verifyAdminCredentials(username, password);
  if (!ok) {
    return failWithDelay();
  }

  // 5. Sign JWT and set cookie
  const token = await signSession({ username });
  const opts = sessionCookieOptions();

  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(SESSION_COOKIE, token, opts);

  return res;
}
