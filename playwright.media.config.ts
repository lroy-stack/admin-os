import { defineConfig, devices } from "@playwright/test";

import base from "./playwright.config";

/**
 * README and landing media, not tests: `npm run media` rebuilds every image in `media/` from a production build with
 * the mock adapter. One worker, so frame timing in the recordings is not skewed by parallel pages.
 */
export default defineConfig({
  ...base,
  testDir: "e2e/media",
  testMatch: "*.capture.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 180_000,
  projects: [{ name: "media", use: { ...devices["Desktop Chrome"], actionTimeout: 15_000 } }],
});
