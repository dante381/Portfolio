// src/app/api/track/route.ts
// POST /api/track — analytics event ingest endpoint.
//
// Security checklist (per spec):
//   ✓ DNT/Sec-GPC honored → 204, no write
//   ✓ Origin/Referer same-site check
//   ✓ Body size guard (≤2 KB)
//   ✓ Zod validation; unknown keys rejected
//   ✓ Rate limit 60 req/min/IP → 429
//   ✓ visitor_hash = sha256(ip|ua|dailySalt) — NO raw IP/UA stored
//   ✓ Generic error responses; stack never sent to client
//   ✓ Drizzle parameterized queries only

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sessions, events } from "@/lib/db/schema";
import {
  parseUA,
  getGeo,
  visitorHash,
  isDoNotTrack,
  referrerHost,
} from "@/lib/analytics";
import { trackPayloadSchema } from "@/lib/validation";
import { limit } from "@/lib/ratelimit";
import { eq } from "drizzle-orm";

// ── Helpers ────────────────────────────────────────────────────────────────

const BODY_SIZE_LIMIT = 2048; // 2 KB

function getClientIp(req: NextRequest): string {
  // x-forwarded-for may be a comma-separated list; take the first (leftmost) entry.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Derive allowed host from the request URL itself
  const host = req.nextUrl.host; // e.g. "localhost:3000" or "yoursite.vercel.app"

  // Allow requests with no Origin/Referer header (e.g. server-side, curl in dev)
  // Only check when headers are present.
  if (!origin && !referer) return true;

  const checkHost = (headerValue: string): boolean => {
    try {
      return new URL(headerValue).host === host;
    } catch {
      return false;
    }
  };

  if (origin) return checkHost(origin);
  if (referer) return checkHost(referer);
  return true;
}

// Generate a simple random session ID (no external dep)
function randomSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. DNT / Sec-GPC — honor immediately, no data written
    if (isDoNotTrack(req.headers)) {
      return new NextResponse(null, { status: 204 });
    }

    // 2. Origin / Referer same-site check
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Body size guard
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > BODY_SIZE_LIMIT) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 4. Rate limit (per client IP)
    const clientIp = getClientIp(req);
    const { success: withinLimit } = await limit(clientIp);
    if (!withinLimit) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 5. Parse + validate body
    let rawBody: unknown;
    try {
      const text = await req.text();
      if (text.length > BODY_SIZE_LIMIT) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      }
      rawBody = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const parsed = trackPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const payload = parsed.data;

    // 6. Derive analytics data — NO raw IP/UA stored beyond this scope
    const ua = req.headers.get("user-agent") ?? "";
    const hash = visitorHash(clientIp, ua); // sha256, daily-rotating
    const { device, os, browser } = parseUA(ua);
    const { country, city } = getGeo(req.headers);
    const refHost = referrerHost(req.headers.get("referer"));

    // 7. Upsert session (find existing hash for today or create new)
    let sessionId: string;

    const existing = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.visitor_hash, hash))
      .limit(1);

    if (existing.length > 0) {
      // Update last_seen for the existing session
      sessionId = existing[0].id;
      await db
        .update(sessions)
        .set({ last_seen: new Date() })
        .where(eq(sessions.id, sessionId));
    } else {
      // Create new session
      sessionId = randomSessionId();
      await db.insert(sessions).values({
        id: sessionId,
        visitor_hash: hash, // privacy-safe hash only
        country,
        device,
        // first_seen / last_seen default to now()
      });
    }

    // 8. Insert event
    await db.insert(events).values({
      type: payload.type,
      path: payload.path ?? req.nextUrl.pathname,
      section: payload.section ?? null,
      referrer_host: refHost, // hostname only
      country,
      city,
      device,
      os,
      browser,
      session_id: sessionId,
      // id / created_at default in DB
    });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    // Log server-side only — never send stack or DB errors to client
    console.error("[api/track] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
