import { cloudflareTest } from "@cloudflare/vitest-plugin";
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
    // Agent worktrees are full checkouts with their own suite; e2e/ holds Playwright specs, run by `npm run test:e2e`.
    exclude: [...configDefaults.exclude, ".claude/worktrees/**", "e2e/**"],
    projects: [
      {
        extends: true,
        test: {
          name: "app",
          // The device zone is pinned far from UTC, so a calendar day that shifts with the device ("does not shift
          // with the device zone") fails here instead of passing by luck in UTC.
          env: { TZ: "America/Los_Angeles" },
          exclude: [...configDefaults.exclude, ".claude/worktrees/**", "e2e/**", "workers/**"],
        },
      },
      {
        // The store tests run inside workerd, against the Durable Object the way Cloudflare runs it (workers/demo-store).
        extends: true,
        plugins: [cloudflareTest({ wrangler: { configPath: "./workers/demo-store/wrangler.jsonc" } })],
        test: { name: "workers", include: ["workers/demo-store/**/*.test.ts"] },
      },
      {
        // The MCP Worker's tests run inside workerd too, through its fetch handler (workers/mcp, ADR 0016 AC12).
        extends: true,
        plugins: [cloudflareTest({ wrangler: { configPath: "./workers/mcp/test/wrangler.jsonc" } })],
        test: { name: "workers-mcp", include: ["workers/mcp/**/*.test.ts"] },
      },
    ],
  },
});
