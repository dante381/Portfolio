// @vitest-environment node
// src/tests/api-stats.test.ts
// Integration tests for GET /api/stats.
//
// Strategy: mock getSession (auth) and the DB client to test route logic
// without hitting Neon or needing real credentials.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock auth
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}));

// Use vi.hoisted so mockDbSelect is available when vi.mock factory runs
const { mockDbSelect } = vi.hoisted(() => {
  return { mockDbSelect: vi.fn() };
});

// Mock DB client — hoisted so the factory can reference mockDbSelect
vi.mock("@/lib/db/client", () => ({
  db: {
    select: mockDbSelect,
  },
}));

import { GET } from "@/app/api/stats/route";
import { getSession } from "@/lib/auth";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_SESSION = { sub: "testadmin", iat: 1000000, exp: 1007200 };

// ── DB chain factory ──────────────────────────────────────────────────────────

/**
 * Build a chain mock that satisfies db.select().from().where()...orderBy().limit()
 * and also works when the chain is awaited directly (without .limit).
 */
function makeDbChain(rows: unknown[] = [], scalarValue = 0) {
  const scalarRows = [{ value: scalarValue }];

  const limitMock = vi.fn().mockResolvedValue(rows);

  const orderByChain = {
    limit: limitMock,
    // thennable — for `await db.select().from().where().groupBy().orderBy()`
    then: (
      resolve: (v: unknown) => void,
      reject: (e: unknown) => void
    ) => Promise.resolve(rows).then(resolve, reject),
  };

  const groupByChain = {
    orderBy: vi.fn().mockReturnValue(orderByChain),
    // thennable — for queries without orderBy
    then: (
      resolve: (v: unknown) => void,
      reject: (e: unknown) => void
    ) => Promise.resolve(rows).then(resolve, reject),
  };

  const whereChain = {
    groupBy: vi.fn().mockReturnValue(groupByChain),
    // thennable — for aggregate queries `await db.select().from().where()`
    then: (
      resolve: (v: unknown) => void,
      reject: (e: unknown) => void
    ) => Promise.resolve(scalarRows).then(resolve, reject),
  };

  const fromChain = {
    where: vi.fn().mockReturnValue(whereChain),
    // thennable — for queries without where
    then: (
      resolve: (v: unknown) => void,
      reject: (e: unknown) => void
    ) => Promise.resolve(rows).then(resolve, reject),
  };

  return { from: vi.fn().mockReturnValue(fromChain) };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(search = "") {
    return new NextRequest(
      `http://localhost:3000/api/stats${search}`,
      {
        method: "GET",
        headers: {
          host: "localhost:3000",
          cookie: "session=mock.jwt.token",
        },
      }
    );
  }

  // ── Auth guard ─────────────────────────────────────────────────────────────

  it("returns 401 when session is null (no cookie)", async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = makeRequest();
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when session verification fails", async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/stats", {
      method: "GET",
      headers: { host: "localhost:3000", cookie: "session=bad.token.here" },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  // ── Range validation ───────────────────────────────────────────────────────

  it("returns 400 for invalid range parameter", async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_SESSION);
    mockDbSelect.mockReturnValue(makeDbChain());

    const req = makeRequest("?range=999d");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Invalid range");
  });

  // ── Happy path ─────────────────────────────────────────────────────────────

  it("returns 200 with correct aggregate shape for valid session", async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_SESSION);
    mockDbSelect.mockReturnValue(makeDbChain([], 0));

    const req = makeRequest("?range=30d");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify shape
    expect(body).toHaveProperty("range");
    expect(body).toHaveProperty("totals");
    expect(body.totals).toHaveProperty("events");
    expect(body.totals).toHaveProperty("uniqueVisitors");
    expect(body.totals).toHaveProperty("downloads");
    expect(body.totals).toHaveProperty("contactClicks");
    expect(body).toHaveProperty("timeSeries");
    expect(body).toHaveProperty("topSections");
    expect(body).toHaveProperty("devices");
    expect(body).toHaveProperty("topReferrers");
    expect(body).toHaveProperty("geo");
    expect(Array.isArray(body.timeSeries)).toBe(true);
    expect(Array.isArray(body.topSections)).toBe(true);
    expect(Array.isArray(body.devices)).toBe(true);
    expect(Array.isArray(body.topReferrers)).toBe(true);
    expect(Array.isArray(body.geo)).toBe(true);
  });

  it("accepts all valid range values (7d, 30d, 90d)", async () => {
    for (const r of ["7d", "30d", "90d"]) {
      vi.clearAllMocks();
      (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_SESSION);
      mockDbSelect.mockReturnValue(makeDbChain());

      const req = makeRequest(`?range=${r}`);
      const res = await GET(req);
      expect(res.status).toBe(200);
    }
  });

  // ── Error handling ─────────────────────────────────────────────────────────

  it("returns 500 on DB error without leaking stack trace", async () => {
    (getSession as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_SESSION);

    // Simulate DB throwing
    mockDbSelect.mockImplementation(() => {
      throw new Error("Connection refused");
    });

    const req = makeRequest();
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
    // Must not leak stack trace
    expect(JSON.stringify(body)).not.toContain("Connection refused");
    expect(JSON.stringify(body)).not.toContain("at ");
  });
});
