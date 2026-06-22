#!/usr/bin/env node
/**
 * gen-admin.mjs — Local utility to bootstrap admin credentials.
 *
 * Usage:
 *   node scripts/gen-admin.mjs <username> <password>
 *
 * What it does:
 *   1. bcryptjs-hashes the password at cost 12 (plaintext NEVER written anywhere).
 *   2. Generates a random 32-byte base64 AUTH_SECRET (if not already in .env.local).
 *   3. Generates a random 32-byte base64 HASH_SALT (if not already in .env.local).
 *   4. Updates .env.local in place — preserves DATABASE_URL and all other keys.
 *   5. Prints only the names of vars written (never their values).
 *
 * Security:
 *   - Never echoes the plaintext password.
 *   - .env.local is gitignored — this script must never be committed with real values.
 *   - Run locally only; don't pipe output to files that might be committed.
 */

import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Silence unused-import: we reference createHash so tree-shaking keeps it
void createHash;

// ── Args ──────────────────────────────────────────────────────────────────────

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error("Usage: node scripts/gen-admin.mjs <username> <password>");
  process.exit(1);
}

if (username.length < 3 || username.length > 64) {
  console.error("username must be 3–64 characters");
  process.exit(1);
}

if (password.length < 12) {
  console.error("password must be at least 12 characters");
  process.exit(1);
}

// ── Hash password ─────────────────────────────────────────────────────────────

// Dynamic import so bcryptjs is only required at runtime (avoids ESM/CJS issues)
const bcrypt = await import("bcryptjs");
const hash = await bcrypt.hash(password, 12);

// ── Read existing .env.local ───────────────────────────────────────────────────

const envPath = resolve(process.cwd(), ".env.local");

/** Parse a .env.local file into a Map<key, raw-line> preserving comments/blanks. */
function parseEnv(content) {
  const lines = content.split("\n");
  /** @type {Map<string, string>} key → full line */
  const map = new Map();
  /** @type {string[]} ordered keys (including comment/blank sentinels) */
  const order = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      // Use a unique sentinel so blank/comment lines are preserved
      const sentinel = `__blank_${order.length}__`;
      order.push(sentinel);
      map.set(sentinel, line);
      continue;
    }
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    order.push(key);
    map.set(key, line);
  }

  return { map, order };
}

let existingContent = "";
if (existsSync(envPath)) {
  existingContent = readFileSync(envPath, "utf8");
}

const { map, order } = parseEnv(existingContent);

// ── Build updated values ───────────────────────────────────────────────────────

const written = [];

function setVar(key, value) {
  if (!map.has(key)) {
    order.push(key);
  }
  // Escape `$` as `\$` so Next.js (@next/env) does NOT treat it as variable
  // expansion — critical for bcrypt hashes like `$2b$12$...`.
  const escaped = String(value).replace(/\$/g, "\\$");
  map.set(key, `${key}=${escaped}`);
  written.push(key);
}

// Always (re)set admin creds
setVar("ADMIN_USERNAME", username);
setVar("ADMIN_PASSWORD_HASH", hash);

/** Extract a var's value from its stored line, stripping quotes/whitespace. Empty/missing → "". */
function getValue(key) {
  if (!map.has(key)) return "";
  const line = map.get(key);
  const eqIdx = line.indexOf("=");
  if (eqIdx === -1) return "";
  let v = line.slice(eqIdx + 1).trim();
  // strip surrounding single or double quotes
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    v = v.slice(1, -1);
  }
  return v.trim();
}

// Only generate secrets if not already present AND non-empty
if (!getValue("AUTH_SECRET")) {
  setVar("AUTH_SECRET", randomBytes(32).toString("base64"));
} else {
  console.log("AUTH_SECRET already set — keeping existing value.");
}

if (!getValue("HASH_SALT")) {
  setVar("HASH_SALT", randomBytes(32).toString("base64"));
} else {
  console.log("HASH_SALT already set — keeping existing value.");
}

// ── Write back ────────────────────────────────────────────────────────────────

const newContent = order.map((k) => map.get(k) ?? "").join("\n");
writeFileSync(envPath, newContent.endsWith("\n") ? newContent : newContent + "\n", "utf8");

// ── Report ────────────────────────────────────────────────────────────────────

console.log("\nWrote to .env.local:");
for (const k of written) {
  console.log(`  ✓ ${k}`);
}
console.log(
  "\nDone. Start the dev server or deploy with these env vars. Never commit .env.local.\n"
);
