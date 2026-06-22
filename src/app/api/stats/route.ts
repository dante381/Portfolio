// src/app/api/stats/route.ts
// GET /api/stats — analytics aggregates for the dashboard.
//
// Auth-gated: middleware guards this route, and we re-check server-side
// (defense in depth, per plan spec S-04).
//
// Returns aggregates over `events` and `sessions` tables.
// Never leaks stack traces or DB errors to the client.

export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { events, sessions } from "@/lib/db/schema";
import { statsRangeSchema, STATS_RANGES } from "@/lib/validation";
import { sql, gte, count, countDistinct } from "drizzle-orm";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayBucket {
  date: string; // "YYYY-MM-DD"
  count: number;
}

interface StatsResponse {
  range: string;
  totals: {
    events: number;
    uniqueVisitors: number;
    downloads: number;
    contactClicks: number;
  };
  timeSeries: DayBucket[];
  topSections: { section: string; count: number }[];
  devices: { device: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  geo: { country: string; count: number }[];
}

// ── Range helper ──────────────────────────────────────────────────────────────

function rangeToDays(range: (typeof STATS_RANGES)[number]): number {
  switch (range) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "30d":
    default:
      return 30;
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 1. Defense-in-depth auth check (middleware also guards this)
  const session = await getSession(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate ?range= query param
  const rangeParam = req.nextUrl.searchParams.get("range") ?? "30d";
  const rangeParsed = statsRangeSchema.safeParse(rangeParam);
  if (!rangeParsed.success) {
    return NextResponse.json(
      { error: "Invalid range parameter. Use 7d, 30d, or 90d." },
      { status: 400 }
    );
  }

  const range = rangeParsed.data;
  const days = rangeToDays(range);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    // 3. Run all aggregation queries in parallel

    // Total event count
    const [totalEventsRow] = await db
      .select({ value: count() })
      .from(events)
      .where(gte(events.created_at, since));

    // Unique visitors = distinct session_ids (each session = one visitor-day)
    const [uniqueVisitorsRow] = await db
      .select({ value: countDistinct(events.session_id) })
      .from(events)
      .where(gte(events.created_at, since));

    // Downloads count
    const [downloadsRow] = await db
      .select({ value: count() })
      .from(events)
      .where(
        sql`${events.created_at} >= ${since} AND ${events.type} = 'download'`
      );

    // Contact clicks count
    const [contactClicksRow] = await db
      .select({ value: count() })
      .from(events)
      .where(
        sql`${events.created_at} >= ${since} AND ${events.type} = 'click' AND ${events.section} = 'contact'`
      );

    // Time-series: events per day for the range
    const timeSeriesRows = await db
      .select({
        date: sql<string>`DATE(${events.created_at})`.as("date"),
        count: count(),
      })
      .from(events)
      .where(gte(events.created_at, since))
      .groupBy(sql`DATE(${events.created_at})`)
      .orderBy(sql`DATE(${events.created_at})`);

    // Top sections by scroll/view events
    const topSectionsRows = await db
      .select({
        section: events.section,
        count: count(),
      })
      .from(events)
      .where(
        sql`${events.created_at} >= ${since} AND ${events.section} IS NOT NULL`
      )
      .groupBy(events.section)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Device split
    const devicesRows = await db
      .select({
        device: events.device,
        count: count(),
      })
      .from(events)
      .where(
        sql`${events.created_at} >= ${since} AND ${events.device} IS NOT NULL`
      )
      .groupBy(events.device)
      .orderBy(sql`count(*) DESC`);

    // Top referrer hosts
    const topReferrersRows = await db
      .select({
        referrer: events.referrer_host,
        count: count(),
      })
      .from(events)
      .where(
        sql`${events.created_at} >= ${since} AND ${events.referrer_host} IS NOT NULL`
      )
      .groupBy(events.referrer_host)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Geo: country breakdown (from sessions for unique visitor granularity)
    const geoRows = await db
      .select({
        country: sessions.country,
        count: countDistinct(sessions.id),
      })
      .from(sessions)
      .where(
        sql`${sessions.first_seen} >= ${since} AND ${sessions.country} IS NOT NULL`
      )
      .groupBy(sessions.country)
      .orderBy(sql`count(distinct ${sessions.id}) DESC`)
      .limit(20);

    // 4. Shape response
    const result: StatsResponse = {
      range,
      totals: {
        events: Number(totalEventsRow?.value ?? 0),
        uniqueVisitors: Number(uniqueVisitorsRow?.value ?? 0),
        downloads: Number(downloadsRow?.value ?? 0),
        contactClicks: Number(contactClicksRow?.value ?? 0),
      },
      timeSeries: timeSeriesRows.map((r) => ({
        date: r.date,
        count: Number(r.count),
      })),
      topSections: topSectionsRows
        .filter((r) => r.section != null)
        .map((r) => ({
          section: r.section as string,
          count: Number(r.count),
        })),
      devices: devicesRows
        .filter((r) => r.device != null)
        .map((r) => ({
          device: String(r.device),
          count: Number(r.count),
        })),
      topReferrers: topReferrersRows
        .filter((r) => r.referrer != null)
        .map((r) => ({
          referrer: r.referrer as string,
          count: Number(r.count),
        })),
      geo: geoRows
        .filter((r) => r.country != null)
        .map((r) => ({
          country: r.country as string,
          count: Number(r.count),
        })),
    };

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    // Log server-side only — never leak stack or DB error to client
    console.error("[/api/stats] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
