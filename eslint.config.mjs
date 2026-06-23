import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Reuse the react-hooks plugin instance from eslint-config-next to avoid
// double-registration in flat config (each config object must declare its plugins).
const reactHooksPlugin = nextVitals.find(
  (c) => c.plugins?.["react-hooks"]
)?.plugins["react-hooks"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Netlify build artifacts
    ".netlify/**",
  ]),
  {
    // Project-level rule overrides — plugin must be in same config object (flat config v9).
    ...(reactHooksPlugin ? { plugins: { "react-hooks": reactHooksPlugin } } : {}),
    rules: {
      // The set-state-in-effect rule flags the common async data-fetch pattern
      // (useCallback + useEffect). The state updates are inside an async function,
      // not synchronous effect body mutations. Downgrade to warning.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
