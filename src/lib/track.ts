// src/lib/track.ts
// Tracking stub — Phase 1 version. No-op in production, debug-logs in dev.
// Phase 2 will replace the body with navigator.sendBeacon('/api/track', ...).
// DO NOT change the function signature — Phase 2 wires directly into this.

export interface TrackEvent {
  type: "view" | "scroll" | "click" | "download";
  section?: string;
  path?: string;
}

/**
 * Track a user interaction event.
 * Phase 1: no-op (console.debug in dev only).
 * Phase 2: replace body with sendBeacon call to /api/track.
 */
export function track(event: TrackEvent): void {
  if (process.env.NODE_ENV === "development") {
    console.debug("[track]", event);
  }
  // Phase 2: replace above with:
  // if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
  //   navigator.sendBeacon("/api/track", JSON.stringify(event));
  // }
}
