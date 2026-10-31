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
    // Agent worktrees under .claude/worktrees are full checkouts; their copies of the suite are not this checkout's.
    exclude: [...configDefaults.exclude, ".claude/worktrees/**"],
  },
});
