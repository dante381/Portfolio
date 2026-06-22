// src/lib/ratelimit.ts
// Rate limiting for API routes.
//
// - If UPSTASH_REDIS_REST_URL is set: use Upstash Ratelimit (production).
// - Otherwise: in-memory sliding window Map (local dev / test only — not
//   suitable for multi-instance deployments).
//
// Export: limit(key: string) → Promise<{ success: boolean }>

// ── In-memory fallback ─────────────────────────────────────────────────────

interface WindowEntry {
  count: number;
  windowStart: number;
}

// Simple in-process sliding-window store (per-IP).
// Max 200 entries kept to bound memory; LRU eviction is skipped to keep
// the fallback dependency-free — this is dev/test only.
const inMemoryStore = new Map<string, WindowEntry>();
const IN_MEMORY_MAX_ENTRIES = 200;

function inMemoryLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { success: boolean } {
  const now = Date.now();

  // Trim old entries when the store grows large
  if (inMemoryStore.size > IN_MEMORY_MAX_ENTRIES) {
    for (const [k, v] of inMemoryStore) {
      if (now - v.windowStart > windowMs) {
        inMemoryStore.delete(k);
      }
    }
  }

  const entry = inMemoryStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    inMemoryStore.set(key, { count: 1, windowStart: now });
    return { success: true };
  }

  if (entry.count >= maxRequests) {
    return { success: false };
  }

  entry.count += 1;
  return { success: true };
}

// ── Upstash Ratelimit (production) ─────────────────────────────────────────

type LimitFn = (key: string) => Promise<{ success: boolean }>;

async function getUpstashLimiter(): Promise<LimitFn | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    // Dynamic import so the module is only loaded when Upstash is configured.
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const redis = new Redis({ url, token });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: false,
    });

    return (key: string) => ratelimit.limit(key);
  } catch {
    // Upstash packages not installed — fall back to in-memory
    return null;
  }
}

// Lazy-initialise once
let limiterPromise: Promise<LimitFn | null> | null = null;

function getLimiter(): Promise<LimitFn | null> {
  if (!limiterPromise) {
    limiterPromise = getUpstashLimiter();
  }
  return limiterPromise;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Rate-limit a request by key (typically the client IP).
 * /api/track: 60 requests per 60-second sliding window.
 *
 * @returns { success: true } if under limit, { success: false } if exceeded.
 */
export async function limit(key: string): Promise<{ success: boolean }> {
  const upstash = await getLimiter();
  if (upstash) {
    return upstash(key);
  }
  // Fallback: 60 req / 60 s in-memory
  return inMemoryLimit(key, 60, 60_000);
}

/**
 * Reset the in-memory store (test helper — only affects the fallback path).
 */
export function _resetInMemoryStore(): void {
  inMemoryStore.clear();
  limiterPromise = null;
}
