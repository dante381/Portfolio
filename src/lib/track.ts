// src/lib/track.ts
// Client-side analytics beacon utility.
//
// Uses navigator.sendBeacon for fire-and-forget reliability with a fetch
// keepalive fallback. Respects the client-side DNT setting.
//
// Signature is IDENTICAL to the Phase 1 stub — all existing call sites
// (SectionWrapper, ContactSection) work without changes.

export interface TrackEvent {
  type: "view" | "scroll" | "click" | "download";
  section?: string;
  path?: string;
}

/**
 * Track a user interaction event.
 *
 * Sends to POST /api/track via sendBeacon (fire-and-forget, survives page unload).
 * Falls back to fetch with keepalive if sendBeacon is unavailable.
 *
 * Silently no-ops when:
 * - Running on the server (typeof window === 'undefined')
 * - The browser's DNT setting is enabled (navigator.doNotTrack === '1')
 */
export function track(event: TrackEvent): void {
  // Server-side guard: this function is only meaningful in the browser.
  if (typeof window === "undefined") return;

  // Client-side DNT check (complements the server-side check in /api/track).
  if (navigator.doNotTrack === "1") return;

  const path = event.path ?? window.location.pathname;
  const payload: TrackEvent = { ...event, path };
  const body = JSON.stringify(payload);

  // Primary: sendBeacon — works even if the page is being unloaded
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const sent = navigator.sendBeacon("/api/track", blob);
    if (sent) return;
    // sendBeacon can return false if the queue is full — fall through to fetch
  }

  // Fallback: fetch with keepalive
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Silently swallow network errors — tracking must never break the UI
  });
}
