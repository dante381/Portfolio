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
