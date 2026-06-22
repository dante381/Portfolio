import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.ts"],
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Exclude Playwright e2e specs — they need the Playwright runner, not vitest
    exclude: ["src/tests/e2e/**", "node_modules/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Allow tests to import middleware from repo root via "@root/middleware"
      "@root": path.resolve(__dirname, "."),
    },
  },
});
