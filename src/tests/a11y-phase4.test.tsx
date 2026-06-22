// src/tests/a11y-phase4.test.tsx
// Phase 4 a11y additions: login page + dashboard client.
// Extends the existing a11y.test.tsx coverage.

import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

// ── Mocks ─────────────────────────────────────────────────────────────────────

// Mock next/navigation (LoginForm and DashboardClient depend on useRouter / useSearchParams)
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: vi.fn().mockReturnValue(null) }),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock recharts (not available in jsdom — avoids canvas errors)
vi.mock("recharts", () => ({
  LineChart: () => <div data-testid="line-chart" aria-label="Line chart" />,
  BarChart: () => <div data-testid="bar-chart" aria-label="Bar chart" />,
  PieChart: () => <div data-testid="pie-chart" aria-label="Pie chart" />,
  Line: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div style={{ width: 300, height: 200 }}>{children}</div>,
}));

// ── a11y helper (same as a11y.test.tsx) ──────────────────────────────────────

async function assertNoViolations(container: Element) {
  const results = await axe(container);
  const serious = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious"
  );
  if (serious.length > 0) {
    const details = serious
      .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
      .join("\n");
    throw new Error(
      `Axe found ${serious.length} serious/critical violations:\n${details}`
    );
  }
  const minor = results.violations.filter(
    (v) => v.impact !== "critical" && v.impact !== "serious"
  );
  if (minor.length > 0) {
    console.warn(
      "Non-critical axe issues:",
      minor.map((v) => v.id).join(", ")
    );
  }
  expect(serious).toHaveLength(0);
}

// ── Login page a11y ───────────────────────────────────────────────────────────

// LoginPage is a "use client" component — import directly.
// We wrap with Suspense since LoginPage uses Suspense internally.
import { Suspense } from "react";
import LoginPage from "@/app/login/page";

describe("Accessibility (axe) — login page", () => {
  it("LoginPage has no serious/critical violations", async () => {
    const { container } = render(
      <Suspense>
        <LoginPage />
      </Suspense>
    );
    await assertNoViolations(container);
  });
});

// ── Dashboard client a11y ─────────────────────────────────────────────────────

import { DashboardClient } from "@/app/dashboard/DashboardClient";

describe("Accessibility (axe) — DashboardClient", () => {
  it("DashboardClient loading state has no serious/critical violations", async () => {
    // Render without stats data (loading=true, stats=null initially)
    const { container } = render(<DashboardClient username="admin" />);
    await assertNoViolations(container);
  });
});
