// src/app/dashboard/page.tsx
// Private analytics dashboard — server component that checks auth and
// delegates to the DashboardClient for interactive charts.
//
// Auth is double-gated: middleware redirects unauthenticated requests to /login,
// and this server component re-checks session (defense in depth, S-04).

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardClient } from "./DashboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Anish Kshirsagar",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login?next=/dashboard");
  }

  return <DashboardClient username={session.sub ?? "admin"} />;
}
