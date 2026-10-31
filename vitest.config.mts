import { configDefaults, defineConfig } from "vitest/config";

import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real package throws outside a server bundle; tests load server entries as plain modules.
      "server-only": fileURLToPath(new URL("./src/core/testing/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    // The device zone is pinned far from UTC, so a calendar day that shifts with the device ("does not shift with the
    // device zone") fails here instead of passing by luck in UTC.
    env: { TZ: "America/Los_Angeles" },
    // Agent worktrees are full checkouts with their own suite; e2e/ holds Playwright specs, run by `npm run test:e2e`.
    exclude: [...configDefaults.exclude, ".claude/worktrees/**", "e2e/**"],
  },
});
