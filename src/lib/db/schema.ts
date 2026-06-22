// src/lib/db/schema.ts
// Drizzle ORM schema for analytics tables.
// NEVER add raw IP, raw UA, or any PII columns here.

import {
  pgTable,
  text,
  uuid,
  timestamp,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────

export const eventTypeEnum = pgEnum("event_type", [
  "view",
  "scroll",
  "click",
  "download",
]);

export const deviceTypeEnum = pgEnum("device_type", [
  "mobile",
  "tablet",
  "desktop",
]);

// ── sessions ──────────────────────────────────────────────────────────────
// One row per visitor-day (visitor_hash rotates daily — see analytics.ts).
// NO raw IP, NO raw UA stored.

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(), // random nanoid-style string
    visitor_hash: text("visitor_hash").notNull(), // sha256(ip|ua|daily-salt)
    first_seen: timestamp("first_seen", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    last_seen: timestamp("last_seen", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    country: text("country"), // from Vercel edge headers (null locally)
    device: text("device"), // mobile | tablet | desktop
  },
  (t) => [
    index("sessions_visitor_hash_idx").on(t.visitor_hash),
    index("sessions_first_seen_idx").on(t.first_seen),
  ]
);

// ── events ─────────────────────────────────────────────────────────────────
// Individual interaction events.  session_id FK → sessions.id.
// referrer_host stores only the hostname (never full URL with query).

export const events = pgTable(
  "events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    type: eventTypeEnum("type").notNull(),
    path: text("path"),
    section: text("section"),
    referrer_host: text("referrer_host"), // hostname only — never full referrer
    country: text("country"),
    city: text("city"),
    device: deviceTypeEnum("device"),
    os: text("os"),
    browser: text("browser"),
    session_id: text("session_id")
      .notNull()
      .references(() => sessions.id),
    created_at: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [
    index("events_created_at_idx").on(t.created_at),
    index("events_type_idx").on(t.type),
    index("events_session_id_idx").on(t.session_id),
  ]
);

// ── Inferred Types ─────────────────────────────────────────────────────────

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
