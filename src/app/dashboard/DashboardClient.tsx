"use client";
// src/app/dashboard/DashboardClient.tsx
// Interactive analytics dashboard with recharts visualisations.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// ── Types ─────────────────────────────────────────────────────────────────────

type Range = "7d" | "30d" | "90d";

interface StatsResponse {
  range: string;
  totals: {
    events: number;
    uniqueVisitors: number;
    downloads: number;
    contactClicks: number;
  };
  timeSeries: { date: string; count: number }[];
  topSections: { section: string; count: number }[];
  devices: { device: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  geo: { country: string; count: number }[];
}

// ── Theme colours ─────────────────────────────────────────────────────────────

const ACCENT = "#64ffda";
const PIPELINE = "#58a6ff";
const MUTED = "#6e7681";
const SURFACE2 = "#1c2333";

const PIE_COLORS = [ACCENT, PIPELINE, "#ff7eb6", "#ffa657", "#d2a8ff", "#79c0ff"];

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
        {label}
      </p>
      <p
        className={`text-3xl font-bold ${accent ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}
        aria-label={`${label}: ${value}`}
      >
        {value}
      </p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest mb-4">
      {children}
    </h2>
  );
}

function EmptyState({ message = "No data available" }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-[var(--color-text-muted)] text-sm">
      {message}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface DashboardClientProps {
  username: string;
}

export function DashboardClient({ username }: DashboardClientProps) {
  const router = useRouter();
  const [range, setRange] = useState<Range>("30d");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchStats = useCallback(async (r: Range) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/stats?range=${r}`);
      if (res.status === 401) {
        router.push("/login?next=/dashboard");
        return;
      }
      if (!res.ok) {
        throw new Error(`Unexpected status ${res.status}`);
      }
      const data: StatsResponse = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void fetchStats(range);
  }, [range, fetchStats]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="font-mono text-[var(--color-accent)] text-xs tracking-widest"
              aria-hidden="true"
            >
              ▸
            </span>
            <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Analytics
            </h1>
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              @{username}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Range selector */}
            <div
              role="group"
              aria-label="Date range"
              className="flex gap-1 rounded-lg border border-[var(--color-border)] p-1"
            >
              {(["7d", "30d", "90d"] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    range === r
                      ? "bg-[var(--color-accent)] text-[var(--color-bg)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="
                text-xs font-medium px-3 py-1.5 rounded
                border border-[var(--color-border)]
                text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
                hover:border-[var(--color-text-muted)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
              aria-label="Log out"
            >
              {loggingOut ? "Logging out…" : "Log out"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main
        id="main-content"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Error state */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-800 bg-red-900/20 px-5 py-4 text-sm text-red-300"
          >
            {error}
            <button
              onClick={() => fetchStats(range)}
              className="ml-3 underline hover:no-underline focus:outline-none"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !stats && (
          <div aria-busy="true" aria-label="Loading analytics data">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse"
                />
              ))}
            </div>
            <div className="h-72 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] animate-pulse mb-6" />
          </div>
        )}

        {stats && (
          <>
            {/* Totals cards */}
            <section aria-labelledby="totals-heading" className="mb-8">
              <h2 id="totals-heading" className="sr-only">Summary totals</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Events" value={stats.totals.events.toLocaleString()} />
                <StatCard label="Unique Visitors" value={stats.totals.uniqueVisitors.toLocaleString()} accent />
                <StatCard label="Resume Downloads" value={stats.totals.downloads.toLocaleString()} />
                <StatCard label="Contact Clicks" value={stats.totals.contactClicks.toLocaleString()} />
              </div>
            </section>

            {/* Time-series chart */}
            <section
              aria-labelledby="timeseries-heading"
              className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
            >
              <SectionHeader>
                <span id="timeseries-heading">Events over time</span>
              </SectionHeader>
              {stats.timeSeries.length === 0 ? (
                <EmptyState />
              ) : (
                <div aria-label={`Line chart: events per day for the last ${range}`}>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart
                      data={stats.timeSeries}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={SURFACE2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: MUTED, fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: SURFACE2 }}
                      />
                      <YAxis
                        tick={{ fill: MUTED, fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#161b22",
                          border: "1px solid #30363d",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: MUTED }}
                        itemStyle={{ color: ACCENT }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={ACCENT}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: ACCENT }}
                        name="Events"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Two-column row: Top Sections + Devices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Top sections */}
              <section
                aria-labelledby="sections-heading"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <SectionHeader>
                  <span id="sections-heading">Top sections</span>
                </SectionHeader>
                {stats.topSections.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div aria-label="Bar chart: top sections by event count">
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={stats.topSections}
                        layout="vertical"
                        margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                      >
                        <XAxis
                          type="number"
                          tick={{ fill: MUTED, fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          dataKey="section"
                          type="category"
                          tick={{ fill: MUTED, fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "#161b22",
                            border: "1px solid #30363d",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          cursor={{ fill: SURFACE2 }}
                          itemStyle={{ color: PIPELINE }}
                          labelStyle={{ color: MUTED }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Events">
                          {stats.topSections.map((_, i) => (
                            <Cell key={i} fill={PIPELINE} opacity={1 - i * 0.08} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

              {/* Device split */}
              <section
                aria-labelledby="devices-heading"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <SectionHeader>
                  <span id="devices-heading">Device split</span>
                </SectionHeader>
                {stats.devices.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div aria-label="Pie chart: traffic by device type">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={stats.devices}
                          dataKey="count"
                          nameKey="device"
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {stats.devices.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#161b22",
                            border: "1px solid #30363d",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                          itemStyle={{ color: ACCENT }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: 11, color: MUTED }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>
            </div>

            {/* Two-column row: Referrers + Geo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top referrers */}
              <section
                aria-labelledby="referrers-heading"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <SectionHeader>
                  <span id="referrers-heading">Top referrers</span>
                </SectionHeader>
                {stats.topReferrers.length === 0 ? (
                  <EmptyState message="No referrer data" />
                ) : (
                  <ol className="space-y-2" aria-label="Top referrer hosts">
                    {stats.topReferrers.map((r, i) => (
                      <li
                        key={r.referrer}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="shrink-0 w-5 text-right font-mono text-xs text-[var(--color-text-muted)]"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          <span
                            className="truncate text-[var(--color-text-secondary)]"
                            title={r.referrer}
                          >
                            {r.referrer}
                          </span>
                        </span>
                        <span className="ml-4 shrink-0 font-mono text-xs text-[var(--color-accent)]">
                          {r.count.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              {/* Geo */}
              <section
                aria-labelledby="geo-heading"
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
              >
                <SectionHeader>
                  <span id="geo-heading">Geographic breakdown</span>
                </SectionHeader>
                {stats.geo.length === 0 ? (
                  <EmptyState message="No geo data (available on Vercel edge)" />
                ) : (
                  <ol className="space-y-2" aria-label="Visitors by country">
                    {stats.geo.map((g, i) => (
                      <li
                        key={g.country}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="shrink-0 w-5 text-right font-mono text-xs text-[var(--color-text-muted)]"
                            aria-hidden="true"
                          >
                            {i + 1}
                          </span>
                          <span className="text-[var(--color-text-secondary)]">
                            {g.country}
                          </span>
                        </span>
                        <span className="ml-4 shrink-0 font-mono text-xs text-[var(--color-pipeline)]">
                          {g.count.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
