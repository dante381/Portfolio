// src/tests/analytics.test.ts
// Unit tests for analytics.ts helper functions.

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  parseUA,
  getGeo,
  visitorHashForDate,
  isDoNotTrack,
  referrerHost,
} from "@/lib/analytics";

// ── parseUA ────────────────────────────────────────────────────────────────

describe("parseUA", () => {
  it("identifies desktop Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const result = parseUA(ua);
    expect(result.device).toBe("desktop");
    expect(result.os).toMatch(/Windows/i);
    expect(result.browser).toMatch(/Chrome/i);
  });

  it("identifies desktop Safari on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15";
    const result = parseUA(ua);
    expect(result.device).toBe("desktop");
    expect(result.os).toMatch(/Mac/i);
    expect(result.browser).toMatch(/Safari/i);
  });

  it("identifies desktop Firefox on Linux", () => {
    const ua =
      "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0";
    const result = parseUA(ua);
    expect(result.device).toBe("desktop");
    expect(result.os).toMatch(/Linux/i);
    expect(result.browser).toMatch(/Firefox/i);
  });

  it("identifies mobile on iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const result = parseUA(ua);
    expect(result.device).toBe("mobile");
    expect(result.os).toMatch(/iOS/i);
  });

  it("identifies mobile on Android", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";
    const result = parseUA(ua);
    expect(result.device).toBe("mobile");
    expect(result.os).toMatch(/Android/i);
  });

  it("identifies tablet on iPad", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const result = parseUA(ua);
    expect(result.device).toBe("tablet");
  });

  it("returns desktop for unknown UA", () => {
    const result = parseUA("CustomBot/1.0");
    expect(result.device).toBe("desktop");
  });

  it("returns null os and browser for empty string", () => {
    const result = parseUA("");
    expect(result.os).toBeNull();
    expect(result.browser).toBeNull();
  });
});

// ── getGeo ─────────────────────────────────────────────────────────────────

describe("getGeo", () => {
  it("extracts country and city from Vercel headers", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "IN",
      "x-vercel-ip-city": "Bangalore",
    });
    const { country, city } = getGeo(headers);
    expect(country).toBe("IN");
    expect(city).toBe("Bangalore");
  });

  it("returns nulls when headers are absent (local env)", () => {
    const headers = new Headers();
    const { country, city } = getGeo(headers);
    expect(country).toBeNull();
    expect(city).toBeNull();
  });
});

// ── visitorHash ────────────────────────────────────────────────────────────

describe("visitorHash / visitorHashForDate", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("produces a hex string of length 64 (sha256)", () => {
    const hash = visitorHashForDate("1.2.3.4", "TestBrowser/1.0", "2026-06-22");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same ip, ua, and date", () => {
    const h1 = visitorHashForDate("1.2.3.4", "Mozilla/5.0", "2026-06-22");
    const h2 = visitorHashForDate("1.2.3.4", "Mozilla/5.0", "2026-06-22");
    expect(h1).toBe(h2);
  });

  it("produces different hash for different IP", () => {
    const h1 = visitorHashForDate("1.2.3.4", "Mozilla/5.0", "2026-06-22");
    const h2 = visitorHashForDate("9.8.7.6", "Mozilla/5.0", "2026-06-22");
    expect(h1).not.toBe(h2);
  });

  it("produces different hash across different days (daily rotation)", () => {
    const h1 = visitorHashForDate("1.2.3.4", "Mozilla/5.0", "2026-06-22");
    const h2 = visitorHashForDate("1.2.3.4", "Mozilla/5.0", "2026-06-23");
    expect(h1).not.toBe(h2);
  });

  it("does NOT include raw ip or ua in the hash output", () => {
    const hash = visitorHashForDate("192.168.1.1", "SomeBrowser", "2026-06-22");
    // The hash must not literally contain the IP or UA string
    expect(hash).not.toContain("192.168.1.1");
    expect(hash).not.toContain("SomeBrowser");
  });
});

// ── isDoNotTrack ───────────────────────────────────────────────────────────

describe("isDoNotTrack", () => {
  it("returns true when DNT: 1 is set", () => {
    const headers = new Headers({ dnt: "1" });
    expect(isDoNotTrack(headers)).toBe(true);
  });

  it("returns true when Sec-GPC: 1 is set", () => {
    const headers = new Headers({ "sec-gpc": "1" });
    expect(isDoNotTrack(headers)).toBe(true);
  });

  it("returns false when DNT: 0", () => {
    const headers = new Headers({ dnt: "0" });
    expect(isDoNotTrack(headers)).toBe(false);
  });

  it("returns false when no DNT headers present", () => {
    const headers = new Headers();
    expect(isDoNotTrack(headers)).toBe(false);
  });

  it("returns true if both DNT and Sec-GPC are set", () => {
    const headers = new Headers({ dnt: "1", "sec-gpc": "1" });
    expect(isDoNotTrack(headers)).toBe(true);
  });
});

// ── referrerHost ───────────────────────────────────────────────────────────

describe("referrerHost", () => {
  it("extracts hostname from a full URL", () => {
    expect(referrerHost("https://google.com/search?q=portfolio")).toBe(
      "google.com"
    );
  });

  it("extracts hostname including subdomain", () => {
    expect(referrerHost("https://www.linkedin.com/jobs")).toBe(
      "www.linkedin.com"
    );
  });

  it("returns null for null input", () => {
    expect(referrerHost(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(referrerHost(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(referrerHost("")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(referrerHost("not-a-url")).toBeNull();
  });

  it("does NOT return query strings or paths — only hostname", () => {
    const host = referrerHost("https://example.com/page?token=secret&id=123");
    expect(host).toBe("example.com");
    expect(host).not.toContain("secret");
    expect(host).not.toContain("token");
  });
});
