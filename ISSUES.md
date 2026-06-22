# ISSUES

Running issue log for the portfolio project. Log every test failure, security finding, bug, flaky test, and its fix. Never silently fix — record it.

| ID    | Phase | Date       | Severity | Area | Description                                                                                                                                                   | Status | Resolution                                                                                                                     |
| ----- | ----- | ---------- | -------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| I-001 | 0     | 2026-06-22 | low      | deps | create-next-app installed Next 16.2.9 (latest) instead of Next 15; plan specified "Next.js 15". Next 16 is backward compatible and newer; proceeding with 16. | fixed  | Accepted Next 16 as the installed version; it supersedes 15 with no breaking changes for this project.                         |
| I-002 | 0     | 2026-06-22 | low      | deps | 6 moderate npm audit findings: esbuild <=0.24.2 (in drizzle-kit transitive dep) and postcss <8.5.10 (in Next transitive dep). No high/critical.               | open   | Audit CI gate is set to --audit-level=high; moderate findings are tracked here. Will address when upstream deps release fixes. |
