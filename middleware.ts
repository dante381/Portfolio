// middleware.ts — Next.js edge middleware.
//
// Guards:
//   /dashboard/* — unauthenticated → redirect to /login?next=<path>
//   /api/stats   — unauthenticated → 401 JSON
//
// Also ensures security headers are applied consistently (belt-and-suspenders
// alongside next.config.ts headers — see S-07).
//
// Uses jose directly (edge-compatible) — NOT the Node.js auth.ts helpers.

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ── Constants ─────────────────────────────────────────────────────────────────

const SESSION_COOKIE = "session";

// ── JWT verify (edge-compatible) ──────────────────────────────────────────────

async function verifyToken(token: string): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return false;

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  const isDashboard = pathname.startsWith("/dashboard");
  const isStatsApi = pathname.startsWith("/api/stats");

  if (isDashboard || isStatsApi) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const authenticated = token ? await verifyToken(token) : false;

    if (!authenticated) {
      if (isStatsApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Redirect to login, preserving the intended destination
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/stats/:path*"],
};
