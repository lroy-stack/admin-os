import { defineConfig } from "vitest/config";

import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The real package throws outside a server bundle; tests load server entries as plain modules.
      "server-only": fileURLToPath(new URL("./src/core/testing/server-only-stub.ts", import.meta.url)),
    },
  },
});
