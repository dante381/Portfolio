// src/tests/api-track.test.ts
// Integration tests for POST /api/track route.
//
// Strategy: mock the db layer and ratelimit module so we test the route
// logic without hitting Neon and without polluting prod data.
// The "no PII" assertion checks that the insert call never includes
// raw ip or raw ua.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ── Module mocks (hoisted above imports) ───────────────────────────────────

// Mock the DB client — replaced before the route module loads
vi.mock("@/lib/db/client", () => {
  const selectResult: unknown[] = [];

  const mockDb = {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(selectResult),
        }),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    _selectResult: selectResult, // expose for test manipulation
  };

  return { db: mockDb };
});

// Mock ratelimit — default to allowing requests
vi.mock("@/lib/ratelimit", () => ({
  limit: vi.fn().mockResolvedValue({ success: true }),
  _resetInMemoryStore: vi.fn(),
}));

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { POST } from "@/app/api/track/route";
import { db } from "@/lib/db/client";
import { limit } from "@/lib/ratelimit";

// ── Helpers ────────────────────────────────────────────────────────────────

const VALID_ORIGIN = "http://localhost:3000";

function makeRequest(
  body: unknown,
  {
    origin = VALID_ORIGIN,
    headers: extraHeaders = {},
    contentLength,
  }: {
    origin?: string;
    headers?: Record<string, string>;
    contentLength?: number;
  } = {}
): NextRequest {
  const bodyStr = JSON.stringify(body);
  const len = contentLength ?? bodyStr.length;

  return new NextRequest("http://localhost:3000/api/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "content-length": String(len),
      origin,
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36",
      "x-forwarded-for": "10.0.0.1",
      ...extraHeaders,
    },
    body: bodyStr,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: no existing session (select returns empty)
    const mockSelect = db.select as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    // Default: rate limit allows
    (limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Happy path ───────────────────────────────────────────────────────

  it("returns 204 for valid payload and inserts session + event", async () => {
    const req = makeRequest({ type: "view", path: "/" });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(db.insert).toHaveBeenCalledTimes(2); // once session, once event
  });

  it("accepts all valid event types", async () => {
    for (const type of ["view", "scroll", "click", "download"] as const) {
      vi.clearAllMocks();
      (limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      const mockSelect = db.select as ReturnType<typeof vi.fn>;
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      const req = makeRequest({ type });
      const res = await POST(req);
      expect(res.status).toBe(204);
    }
  });

  it("updates last_seen when session exists for the visitor_hash", async () => {
    // Simulate existing session
    const mockSelect = db.select as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ id: "existing-session-id" }]),
        }),
      }),
    });

    const req = makeRequest({ type: "scroll", section: "about" });
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(db.update).toHaveBeenCalledTimes(1); // update last_seen
    expect(db.insert).toHaveBeenCalledTimes(1); // insert event only
  });

  // ── No PII assertion ─────────────────────────────────────────────────

  it("does NOT persist raw IP or raw UA in session or event insert", async () => {
    const req = makeRequest({ type: "view" });
    await POST(req);

    // Get the actual .values() arguments from the chained mock
    const insertMock = db.insert as ReturnType<typeof vi.fn>;
    const valuesMocks = insertMock.mock.results.map((r) => r.value);

    for (const valuesChain of valuesMocks) {
      const valuesCalls = (valuesChain.values as ReturnType<typeof vi.fn>).mock
        .calls;
      for (const [rowArg] of valuesCalls) {
        const rowStr = JSON.stringify(rowArg);
        // Must not contain raw IP
        expect(rowStr).not.toContain("10.0.0.1");
        // Must not contain literal raw UA string
        expect(rowStr).not.toContain(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36"
        );
        // Must contain visitor_hash (the privacy-safe substitute) in session insert
        if (rowStr.includes("visitor_hash")) {
          const row = rowArg as Record<string, unknown>;
          expect(row.visitor_hash).toBeTruthy();
          expect(typeof row.visitor_hash).toBe("string");
          // Should be a 64-char hex sha256
          expect(row.visitor_hash as string).toMatch(/^[0-9a-f]{64}$/);
        }
      }
    }
  });

  it("stores referrer_host (hostname only) not full referrer URL", async () => {
    const req = makeRequest(
      { type: "view" },
      {
        headers: {
          referer: "https://google.com/search?q=anish+portfolio&secret=abc",
        },
      }
    );
    await POST(req);

    const insertMock = db.insert as ReturnType<typeof vi.fn>;
    const valuesMocks = insertMock.mock.results.map((r) => r.value);

    // Find the event insert (has referrer_host field)
    let eventRow: Record<string, unknown> | null = null;
    for (const valuesChain of valuesMocks) {
      const valuesCalls = (valuesChain.values as ReturnType<typeof vi.fn>).mock
        .calls;
      for (const [rowArg] of valuesCalls) {
        const row = rowArg as Record<string, unknown>;
        if ("referrer_host" in row) {
          eventRow = row;
        }
      }
    }

    expect(eventRow).not.toBeNull();
    expect(eventRow!.referrer_host).toBe("google.com");
    // Must not contain query params
    expect(String(eventRow!.referrer_host)).not.toContain("secret");
    expect(String(eventRow!.referrer_host)).not.toContain("q=");
  });

  // ── DNT / Sec-GPC ────────────────────────────────────────────────────

  it("returns 204 and writes NOTHING when DNT: 1", async () => {
    const req = makeRequest(
      { type: "view" },
      { headers: { dnt: "1" } }
    );
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns 204 and writes NOTHING when Sec-GPC: 1", async () => {
    const req = makeRequest(
      { type: "scroll" },
      { headers: { "sec-gpc": "1" } }
    );
    const res = await POST(req);

    expect(res.status).toBe(204);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // ── Input validation ─────────────────────────────────────────────────

  it("returns 400 for invalid event type", async () => {
    const req = makeRequest({ type: "hover" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("returns 400 for unknown section (not whitelisted)", async () => {
    const req = makeRequest({ type: "scroll", section: "admin" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for extra unknown fields", async () => {
    const req = makeRequest({ type: "view", evil: "payload" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/track", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: VALID_ORIGIN,
        "x-forwarded-for": "10.0.0.1",
      },
      body: "not-valid-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  // ── Oversized body ───────────────────────────────────────────────────

  it("returns 413 when content-length exceeds 2KB", async () => {
    const req = makeRequest({ type: "view" }, { contentLength: 9999 });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // ── Rate limiting ────────────────────────────────────────────────────

  it("returns 429 when rate limit is exceeded", async () => {
    (limit as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });

    const req = makeRequest({ type: "view" });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(db.insert).not.toHaveBeenCalled();
  });

  // ── Origin check ─────────────────────────────────────────────────────

  it("returns 403 when Origin host does not match the request host", async () => {
    const req = makeRequest({ type: "view" }, { origin: "https://evil.com" });
    const res = await POST(req);
    expect(res.status).toBe(403);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
