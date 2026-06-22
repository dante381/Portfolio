// @vitest-environment node
// src/tests/auth.test.ts
// Unit tests for src/lib/auth.ts
//
// Environment: node (not jsdom) — jose uses globalThis.TextEncoder/Uint8Array
// which must be Node's implementation for the instanceof check to pass.
//
// Security: NEVER use real admin credentials. All passwords are test-only
// fixture values generated inside this file.

import { describe, it, expect, beforeAll, afterAll } from "vitest";

// ── Env setup (must be set BEFORE importing auth.ts) ─────────────────────────

// 256-bit base64 secret for tests
const TEST_AUTH_SECRET = "dGVzdC1zZWNyZXQtZm9yLXZpdGVzdC11bml0LXRlc3RzLXhYWA==";

beforeAll(() => {
  process.env.AUTH_SECRET = TEST_AUTH_SECRET;
  process.env.ADMIN_USERNAME = "testadmin";
  // ADMIN_PASSWORD_HASH is set after bcrypt hashes the fixture password below
});

afterAll(() => {
  delete process.env.AUTH_SECRET;
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD_HASH;
});

// ── Import after env is set ───────────────────────────────────────────────────

import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
  verifyAdminCredentials,
} from "@/lib/auth";

// ── Fixture creds (test-only — never real password) ───────────────────────────

// A fixture password used only within these tests.
const FIXTURE_PASSWORD = "Vitest-Fixture-Pass-42!";
let FIXTURE_HASH: string;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("hashPassword / verifyPassword", () => {
  beforeAll(async () => {
    // Hash the fixture password once; reuse across tests.
    FIXTURE_HASH = await hashPassword(FIXTURE_PASSWORD);
    process.env.ADMIN_PASSWORD_HASH = FIXTURE_HASH;
  });

  it("produces a valid bcrypt hash (starts with $2a$ or $2b$)", () => {
    expect(FIXTURE_HASH).toMatch(/^\$2[ab]\$/);
  });

  it("verifyPassword returns true for correct password", async () => {
    const ok = await verifyPassword(FIXTURE_PASSWORD, FIXTURE_HASH);
    expect(ok).toBe(true);
  });

  it("verifyPassword returns false for wrong password", async () => {
    const ok = await verifyPassword("wrong-password", FIXTURE_HASH);
    expect(ok).toBe(false);
  });

  it("verifyPassword returns false for empty hash", async () => {
    const ok = await verifyPassword(FIXTURE_PASSWORD, "");
    expect(ok).toBe(false);
  });

  it("two hashes of the same password differ (salt randomness)", async () => {
    const hash2 = await hashPassword(FIXTURE_PASSWORD);
    expect(FIXTURE_HASH).not.toBe(hash2);
  });
});

describe("signSession / verifySession", () => {
  it("sign and verify round-trip returns correct username in sub", async () => {
    const token = await signSession({ username: "testuser" });
    const payload = await verifySession(token);
    expect(payload.sub).toBe("testuser");
  });

  it("token contains iat and exp claims", async () => {
    const token = await signSession({ username: "testuser" });
    const payload = await verifySession(token);
    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
    expect(payload.exp).toBeGreaterThan(payload.iat!);
  });

  it("exp is approximately 2 hours from now", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await signSession({ username: "testuser" });
    const { exp, iat } = await verifySession(token);
    expect(exp! - iat!).toBeGreaterThanOrEqual(7199); // 2h - 1s tolerance
    expect(exp! - iat!).toBeLessThanOrEqual(7201);
    expect(exp!).toBeGreaterThan(before + 7000);
  });

  it("verifySession rejects an expired token", async () => {
    // Forge a token with exp in the past using jose directly.
    // Use Buffer.from + Uint8Array to work around jsdom TextEncoder subclass issue.
    const { SignJWT } = await import("jose");
    const secretBytes = Uint8Array.from(Buffer.from(TEST_AUTH_SECRET));

    const expiredToken = await new SignJWT({ sub: "testuser" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7300) // issued 2h+ ago
      .setExpirationTime(Math.floor(Date.now() / 1000) - 100) // expired 100s ago
      .sign(secretBytes);

    await expect(verifySession(expiredToken)).rejects.toThrow();
  });

  it("verifySession rejects a token signed with a different secret", async () => {
    const { SignJWT } = await import("jose");
    const wrongSecretBytes = Uint8Array.from(
      Buffer.from("wrong-secret-totally-different-XYZ")
    );

    const badToken = await new SignJWT({ sub: "testuser" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(wrongSecretBytes);

    await expect(verifySession(badToken)).rejects.toThrow();
  });

  it("verifySession rejects a tampered token (payload modified)", async () => {
    const token = await signSession({ username: "testuser" });

    // Tamper with the middle segment (payload)
    const parts = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: "hacker", iat: Date.now(), exp: Date.now() + 7200 })
    ).toString("base64url");
    const tamperedToken = [parts[0], tamperedPayload, parts[2]].join(".");

    await expect(verifySession(tamperedToken)).rejects.toThrow();
  });

  it("verifySession rejects a malformed (non-JWT) string", async () => {
    await expect(verifySession("not.a.jwt")).rejects.toThrow();
  });
});

describe("verifyAdminCredentials", () => {
  // FIXTURE_HASH and ADMIN_PASSWORD_HASH are set in the hashPassword suite above.
  // The beforeAll ordering in vitest runs top-level describes sequentially,
  // so by the time these run, FIXTURE_HASH is set.

  it("returns true for correct username and password", async () => {
    process.env.ADMIN_USERNAME = "testadmin";
    process.env.ADMIN_PASSWORD_HASH = FIXTURE_HASH;

    const ok = await verifyAdminCredentials("testadmin", FIXTURE_PASSWORD);
    expect(ok).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const ok = await verifyAdminCredentials("testadmin", "wrong-password-xyz");
    expect(ok).toBe(false);
  });

  it("returns false for wrong username (even with correct password)", async () => {
    const ok = await verifyAdminCredentials("notadmin", FIXTURE_PASSWORD);
    expect(ok).toBe(false);
  });

  it("returns false when ADMIN_PASSWORD_HASH is not set", async () => {
    const savedHash = process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_PASSWORD_HASH;

    const ok = await verifyAdminCredentials("testadmin", FIXTURE_PASSWORD);
    expect(ok).toBe(false);

    process.env.ADMIN_PASSWORD_HASH = savedHash;
  });

  it("unknown-user path still runs bcrypt compare (timing safety)", async () => {
    // Even with a non-existent username, the function must not short-circuit
    // before running bcrypt (to prevent timing oracle). We verify this by
    // checking it still returns false rather than throwing or resolving instantly.
    const start = Date.now();
    const ok = await verifyAdminCredentials("nonexistent-user", FIXTURE_PASSWORD);
    const elapsed = Date.now() - start;

    expect(ok).toBe(false);
    // bcrypt should take at least 50ms even at low cost in CI
    // (at cost 12 it's typically 200-500ms — use a low threshold to be CI-safe)
    expect(elapsed).toBeGreaterThan(50);
  });
});
