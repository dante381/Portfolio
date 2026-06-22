// drizzle.config.ts
// Drizzle Kit configuration for schema migrations.
// DATABASE_URL is read from .env.local — never hardcode it here.

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./src/lib/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
