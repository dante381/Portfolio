// src/lib/validation.ts
// Zod schemas for API input validation.
// All schemas use .strict() to reject unknown keys.

import { z } from "zod";

// Known section IDs from content.ts (whitelist — must stay in sync with navSections)
const KNOWN_SECTION_IDS = [
  "about",
  "skills",
  "experience",
  "case-studies",
  "projects",
  "contact",
] as const;

// Known event types (must match the DB enum)
const EVENT_TYPES = ["view", "scroll", "click", "download"] as const;

/**
 * Schema for POST /api/track body.
 *
 * Rules (per security spec S-05):
 * - `type` must be a known enum value
 * - `section` is optional but if present must be a whitelisted section ID
 * - `path` is optional but max 512 chars
 * - Unknown keys are rejected (.strict())
 */
export const trackPayloadSchema = z
  .object({
    type: z.enum(EVENT_TYPES),
    section: z.enum(KNOWN_SECTION_IDS).optional(),
    path: z.string().max(512).optional(),
  })
  .strict();

export type TrackPayload = z.infer<typeof trackPayloadSchema>;

// ── Auth schemas ───────────────────────────────────────────────────────────────

/**
 * Schema for POST /api/auth/login body.
 * Strict — rejects unknown keys. Clamps lengths to prevent oversized inputs.
 */
export const loginPayloadSchema = z
  .object({
    username: z.string().min(1).max(64),
    password: z.string().min(1).max(1024),
  })
  .strict();

export type LoginPayload = z.infer<typeof loginPayloadSchema>;

/**
 * Allowed values for the ?range= query parameter on /api/stats.
 */
export const STATS_RANGES = ["7d", "30d", "90d"] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

export const statsRangeSchema = z.enum(STATS_RANGES).default("30d");
