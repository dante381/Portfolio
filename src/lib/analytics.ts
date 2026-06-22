// src/lib/analytics.ts
// Server-side analytics helpers.
// SECURITY: never log or return raw IP or raw UA from these functions.

import { createHash } from "node:crypto";
import { UAParser } from "ua-parser-js";

// ── Types ──────────────────────────────────────────────────────────────────

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface ParsedUA {
  device: DeviceType;
  os: string | null;
  browser: string | null;
}

export interface GeoInfo {
  country: string | null;
  city: string | null;
}

// ── UA Parsing ─────────────────────────────────────────────────────────────

/**
 * Parse a User-Agent string into device type, OS, and browser name.
 * Uses ua-parser-js for reliable parsing across common UA formats.
 * Falls back to "desktop" if the type cannot be determined.
 */
export function parseUA(ua: string): ParsedUA {
  const parser = new UAParser(ua);
  const result = parser.getResult();

  const deviceType = result.device.type;
  let device: DeviceType;

  if (deviceType === "mobile") {
    device = "mobile";
  } else if (deviceType === "tablet") {
    device = "tablet";
  } else {
    device = "desktop";
  }

  const os = result.os.name ?? null;
  const browser = result.browser.name ?? null;

  return { device, os, browser };
}

// ── Geo Extraction ─────────────────────────────────────────────────────────

/**
 * Extract country and city from Vercel edge headers.
 * Returns null values when running locally (headers not present).
 */
export function getGeo(headers: Headers): GeoInfo {
  const country = headers.get("x-vercel-ip-country") ?? null;
  const city = headers.get("x-vercel-ip-city") ?? null;
  return { country, city };
}

// ── Visitor Hashing ────────────────────────────────────────────────────────

/**
 * Build the daily rotating salt used for visitor_hash.
 * Format: `${HASH_SALT}:${YYYY-MM-DD}` so the hash rotates every UTC day.
 * This prevents cross-day linkage of the same visitor.
 */
function dailySalt(): string {
  const baseSalt = process.env.HASH_SALT ?? "dev-salt";
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
  return `${baseSalt}:${date}`;
}

/**
 * Compute a privacy-preserving visitor hash.
 * sha256(ip + '|' + ua + '|' + dailySalt)
 *
 * Properties:
 * - Same visitor within a UTC day → same hash (enables unique counting)
 * - Different days → different hash (unlinkable across days, privacy by design)
 * - No raw IP or UA is stored anywhere
 */
export function visitorHash(ip: string, ua: string): string {
  const salt = dailySalt();
  return createHash("sha256")
    .update(`${ip}|${ua}|${salt}`)
    .digest("hex");
}

/**
 * Exposed for testing: compute hash with an explicit date string (YYYY-MM-DD).
 * Do NOT use in production code — the production path always uses today's UTC date.
 */
export function visitorHashForDate(
  ip: string,
  ua: string,
  date: string
): string {
  const baseSalt = process.env.HASH_SALT ?? "dev-salt";
  const salt = `${baseSalt}:${date}`;
  return createHash("sha256")
    .update(`${ip}|${ua}|${salt}`)
    .digest("hex");
}

// ── DNT / Sec-GPC ─────────────────────────────────────────────────────────

/**
 * Return true if the request signals Do Not Track or Global Privacy Control.
 * When true, the API route MUST NOT write any event or session data.
 */
export function isDoNotTrack(headers: Headers): boolean {
  return headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";
}

// ── Referrer Sanitization ─────────────────────────────────────────────────

/**
 * Extract only the hostname from a referrer URL.
 * Strips path, query, and fragment — prevents leakage of sensitive referrer URLs.
 * Returns null if the referrer is absent, invalid, or same-origin.
 */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname || null;
  } catch {
    return null;
  }
}
