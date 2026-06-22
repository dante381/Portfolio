// src/app/api/auth/logout/route.ts
// POST /api/auth/logout — clear the session cookie.

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true }, { status: 200 });

  // Clear the session cookie by setting Max-Age=0
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return res;
}
