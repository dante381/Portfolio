// @vitest-environment node
// src/tests/api-auth-login.test.ts
// Integration tests for POST /api/auth/login.
//
// Strategy: mock the auth lib (verifyAdminCredentials) and ratelimit so we
// test the route logic without bcrypt latency or DB access.
// NEVER uses real admin credentials — fixture values only.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock auth lib — we test route-level behaviour, not bcrypt details
vi.mock("@/lib/auth", () => ({
  verifyAdminCredentials: vi.fn(),
  signSession: vi.fn().mockResolvedValue("mock.jwt.token"),
  sessionCookieOptions: vi.fn().mockReturnValue({
    httpOnly: true,
    secure: false, // test env is not production
    sameSite: "strict",
    path: "/",
    maxAge: 7200,
  }),
  SESSION_COOKIE: "session",
}));

// Mock ratelimit — default allow
vi.mock("@/lib/ratelimit", () => ({
  authLimit: vi.fn().mockResolvedValue({ success: true }),
  limit: vi.fn().mockResolvedValue({ success: true }),
  _resetInMemoryStore: vi.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { verifyAdminCredentials } from "@/lib/auth";
import { authLimit } from "@/lib/ratelimit";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeLoginRequest(
  body: unknown,
  { origin = "http://localhost:3000" }: { origin?: string } = {}
): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin,
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: credentials valid
    (verifyAdminCredentials as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    // Default: rate limit allows
    (authLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  });

  // ── Happy path ──────────────────────────────────────────────────────────

  it("returns 200 and sets session cookie on valid credentials", async () => {
    const req = makeLoginRequest({ username: "admin", password: "ValidPass12!" });
    const res = await POST(req);

    expect(res.status).toBe(200);

    // Cookie must be set
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).not.toBeNull();
    expect(setCookie).toContain("session=");
  });

  it("cookie has HttpOnly flag", async () => {
    const req = makeLoginRequest({ username: "admin", password: "ValidPass12!" });
    const res = await POST(req);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("cookie has SameSite=Strict", async () => {
    const req = makeLoginRequest({ username: "admin", password: "ValidPass12!" });
    const res = await POST(req);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie.toLowerCase()).toContain("samesite=strict");
  });

  it("response body contains { ok: true }", async () => {
    const req = makeLoginRequest({ username: "admin", password: "ValidPass12!" });
    const res = await POST(req);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  // ── Bad credentials ─────────────────────────────────────────────────────

  it("returns 401 generic error on wrong credentials", async () => {
    (verifyAdminCredentials as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const req = makeLoginRequest({ username: "admin", password: "WrongPass!" });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    // Must be generic — no "user not found" vs "wrong password" distinction
    expect(body.error).toBe("Invalid credentials");
    // Must NOT set a session cookie
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeNull();
  });

  // ── Validation errors ────────────────────────────────────────────────────

  it("returns 400 for missing username", async () => {
    const req = makeLoginRequest({ password: "SomePassword!" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing password", async () => {
    const req = makeLoginRequest({ username: "admin" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown extra fields (strict schema)", async () => {
    const req = makeLoginRequest({
      username: "admin",
      password: "ValidPass12!",
      evil: "injection",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "http://localhost:3000",
        "x-forwarded-for": "127.0.0.1",
      },
      body: "not-json{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── Rate limiting ────────────────────────────────────────────────────────

  it("returns 429 when auth rate limit is exceeded", async () => {
    (authLimit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

    const req = makeLoginRequest({ username: "admin", password: "ValidPass12!" });
    const res = await POST(req);

    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain("Too many");
  });

  // ── Origin check ─────────────────────────────────────────────────────────

  it("returns 403 when Origin does not match request host", async () => {
    const req = makeLoginRequest(
      { username: "admin", password: "ValidPass12!" },
      { origin: "https://evil.com" }
    );
    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it("allows requests when Origin matches request host", async () => {
    const req = makeLoginRequest(
      { username: "admin", password: "ValidPass12!" },
      { origin: "http://localhost:3000" }
    );
    const res = await POST(req);

    expect(res.status).toBe(200);
  });
});
