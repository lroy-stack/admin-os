import { defineConfig, devices } from "@playwright/test";

/**
 * Its own port, so the smoke never collides with a developer's `next dev`. `E2E_PORT` gives each parallel checkout
 * (a worktree) its own server; otherwise `reuseExistingServer` would test another checkout's build.
 */
const PORT = Number(process.env.E2E_PORT ?? 3400);

/**
 * Smoke, not features (ADR 0008): Chromium only, against a production build with the mock adapter and the seeded
 * preset clock. Viewports are projects; locales and roles are parameters inside each spec.
 */
export default defineConfig({
  testDir: "e2e",
  // The cross-door e2e needs wrangler and two processes: `npm run test:e2e:workers`, never the default run.
  testIgnore: "workers/**",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
    { name: "1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/dashboard/default`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: { DATA_ADAPTER: "mock" },
  },
});
