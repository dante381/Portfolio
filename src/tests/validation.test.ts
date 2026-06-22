// src/tests/validation.test.ts
// Unit tests for trackPayloadSchema (src/lib/validation.ts).

import { describe, it, expect } from "vitest";
import { trackPayloadSchema } from "@/lib/validation";

describe("trackPayloadSchema", () => {
  // ── Valid payloads ──────────────────────────────────────────────────────

  it("accepts a minimal valid payload (type only)", () => {
    const result = trackPayloadSchema.safeParse({ type: "view" });
    expect(result.success).toBe(true);
  });

  it("accepts all valid event types", () => {
    for (const type of ["view", "scroll", "click", "download"] as const) {
      const result = trackPayloadSchema.safeParse({ type });
      expect(result.success).toBe(true);
    }
  });

  it("accepts payload with optional section from whitelist", () => {
    const result = trackPayloadSchema.safeParse({
      type: "scroll",
      section: "about",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all whitelisted section ids", () => {
    const sections = [
      "about",
      "skills",
      "experience",
      "case-studies",
      "projects",
      "contact",
    ];
    for (const section of sections) {
      const result = trackPayloadSchema.safeParse({ type: "view", section });
      expect(result.success).toBe(true);
    }
  });

  it("accepts payload with optional path", () => {
    const result = trackPayloadSchema.safeParse({
      type: "download",
      path: "/resume.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("accepts full valid payload", () => {
    const result = trackPayloadSchema.safeParse({
      type: "click",
      section: "contact",
      path: "/",
    });
    expect(result.success).toBe(true);
  });

  // ── Invalid payloads ────────────────────────────────────────────────────

  it("rejects unknown event type", () => {
    const result = trackPayloadSchema.safeParse({ type: "hover" });
    expect(result.success).toBe(false);
  });

  it("rejects missing type", () => {
    const result = trackPayloadSchema.safeParse({ section: "about" });
    expect(result.success).toBe(false);
  });

  it("rejects unknown section id (not whitelisted)", () => {
    const result = trackPayloadSchema.safeParse({
      type: "scroll",
      section: "admin",
    });
    expect(result.success).toBe(false);
  });

  it("rejects section with SQL injection attempt", () => {
    const result = trackPayloadSchema.safeParse({
      type: "click",
      section: "'; DROP TABLE events; --",
    });
    expect(result.success).toBe(false);
  });

  it("rejects path exceeding 512 characters", () => {
    const result = trackPayloadSchema.safeParse({
      type: "view",
      path: "a".repeat(513),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown extra keys (.strict())", () => {
    const result = trackPayloadSchema.safeParse({
      type: "view",
      extraField: "malicious",
    });
    expect(result.success).toBe(false);
  });

  it("rejects multiple unknown keys", () => {
    const result = trackPayloadSchema.safeParse({
      type: "view",
      ip: "1.2.3.4",
      ua: "bot/1.0",
    });
    expect(result.success).toBe(false);
  });

  it("rejects null as body", () => {
    const result = trackPayloadSchema.safeParse(null);
    expect(result.success).toBe(false);
  });

  it("rejects empty object", () => {
    const result = trackPayloadSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
