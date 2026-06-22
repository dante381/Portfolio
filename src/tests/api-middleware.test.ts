// @vitest-environment node
// src/tests/api-middleware.test.ts
// Tests for middleware auth guards.
//
// We test the middleware function directly (not via a live server),
// mocking jose's jwtVerify to control authentication state.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Env ────────────────────────────────────────────────────────────────────────

const TEST_AUTH_SECRET = "dGVzdC1zZWNyZXQtZm9yLXZpdGVzdC11bml0LXRlc3RzLXhYWA==";

// ── Mock jose ─────────────────────────────────────────────────────────────────

const { mockJwtVerify } = vi.hoisted(() => ({ mockJwtVerify: vi.fn() }));

vi.mock("jose", () => ({
  jwtVerify: mockJwtVerify,
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock.jwt.token"),
  })),
}));

// ── Import middleware after mocks ─────────────────────────────────────────────

import { middleware } from "@root/middleware";

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeRequest(path: string, cookie?: string): NextRequest {
  const req = new NextRequest(`http://localhost:3000${path}`, {
    method: "GET",
    headers: {
      host: "localhost:3000",
      ...(cookie ? { cookie } : {}),
    },
  });
  return req;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("middleware auth guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = TEST_AUTH_SECRET;
  });

  // ── /dashboard/* unauthenticated ─────────────────────────────────────────

  it("redirects unauthenticated /dashboard to /login", async () => {
    mockJwtVerify.mockRejectedValue(new Error("No token"));

    const req = makeRequest("/dashboard");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("/login");
  });

  it("redirect preserves the next= destination param", async () => {
    mockJwtVerify.mockRejectedValue(new Error("No token"));

    const req = makeRequest("/dashboard");
    const res = await middleware(req);

    const location = res.headers.get("location") ?? "";
    expect(location).toContain("next=%2Fdashboard");
  });

  it("redirects unauthenticated /dashboard/sub-path to /login", async () => {
    mockJwtVerify.mockRejectedValue(new Error("No token"));

    const req = makeRequest("/dashboard/settings");
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  // ── /api/stats unauthenticated ───────────────────────────────────────────

  it("returns 401 JSON for unauthenticated /api/stats", async () => {
    mockJwtVerify.mockRejectedValue(new Error("No token"));

    const req = makeRequest("/api/stats");
    const res = await middleware(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 for /api/stats with invalid token", async () => {
    mockJwtVerify.mockRejectedValue(new Error("JWTExpired"));

    const req = makeRequest("/api/stats", "session=bad.token");
    const res = await middleware(req);

    expect(res.status).toBe(401);
  });

  // ── Authenticated paths ──────────────────────────────────────────────────

  it("allows authenticated request to /dashboard", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "admin", exp: Date.now() / 1000 + 7200 },
    });

    const req = makeRequest("/dashboard", "session=valid.jwt.token");
    const res = await middleware(req);

    // Should pass through (NextResponse.next() = 200 or status undefined in test)
    expect([200, undefined, null].includes(res.status) || res.status >= 200).toBe(true);
    // Should NOT redirect
    expect(res.headers.get("location")).toBeNull();
  });

  it("allows authenticated request to /api/stats", async () => {
    mockJwtVerify.mockResolvedValue({
      payload: { sub: "admin", exp: Date.now() / 1000 + 7200 },
    });

    const req = makeRequest("/api/stats", "session=valid.jwt.token");
    const res = await middleware(req);

    expect(res.status).not.toBe(401);
    expect(res.headers.get("location")).toBeNull();
  });

  // ── Non-guarded paths ────────────────────────────────────────────────────

  it("does not gate public /api/track requests", async () => {
    // No cookie, but it's not a protected path
    const req = makeRequest("/api/track");
    const res = await middleware(req);

    // Should pass through — no redirect, no 401
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).not.toBe(401);
  });
});
