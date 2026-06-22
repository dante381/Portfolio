"use client";
// src/app/login/page.tsx
// Admin login page — on-theme dark UI.
// On success redirects to `?next=` or /dashboard.

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Focus username on mount
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const next = searchParams.get("next");
        // Only allow relative paths to prevent open redirects
        const destination =
          next && next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/dashboard";
        router.push(destination);
        return;
      }

      if (res.status === 429) {
        setError("Too many login attempts. Please wait 15 minutes and try again.");
      } else {
        setError("Invalid username or password.");
      }
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      id="main-content"
      className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] px-4"
    >
      <div
        className="w-full max-w-sm"
        role="main"
      >
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <span
            className="font-mono text-[var(--color-accent)] text-sm tracking-widest uppercase"
            aria-hidden="true"
          >
            ▸ admin
          </span>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
            Dashboard Login
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Private analytics — authorised access only
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-lg">
          {/* Error message */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 rounded-md border border-red-800 bg-red-900/30 px-4 py-3"
            >
              <p
                ref={errorRef}
                className="text-sm text-red-300"
                tabIndex={-1}
              >
                {error}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label="Admin login form"
          >
            {/* Username */}
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Username
              </label>
              <input
                ref={usernameRef}
                id="username"
                type="text"
                autoComplete="username"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="
                  w-full rounded-md border border-[var(--color-border)]
                  bg-[var(--color-surface-2)] px-3 py-2
                  text-[var(--color-text-primary)] text-sm
                  placeholder:text-[var(--color-text-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
                placeholder="admin"
                aria-required="true"
              />
            </div>

            {/* Password */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block mb-1.5 text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full rounded-md border border-[var(--color-border)]
                  bg-[var(--color-surface-2)] px-3 py-2
                  text-[var(--color-text-primary)] text-sm
                  placeholder:text-[var(--color-text-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
                placeholder="••••••••••••"
                aria-required="true"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="
                w-full rounded-md py-2.5 px-4
                bg-[var(--color-accent)] text-[var(--color-bg)]
                font-semibold text-sm
                hover:bg-[var(--color-accent-hover)] active:scale-[0.98]
                focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface)]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
              "
              aria-busy={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p className="mt-6 text-center text-xs text-[var(--color-text-muted)]">
          <Link
            href="/"
            className="hover:text-[var(--color-accent)] transition-colors focus:outline-none focus:underline"
          >
            ← Back to portfolio
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
