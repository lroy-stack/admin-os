import { defineConfig, devices } from "@playwright/test";

import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

/**
 * The cross-door e2e (plan 005, M-H1b; ADR 0016 D7): the web app, the demo store and the MCP Worker as they run
 * under `wrangler dev`, with a real browser on the web side. On demand only (`npm run test:e2e:workers`): it is not
 * part of the default e2e or of CI, because it needs wrangler and two processes.
 *
 * Topology, as in docs/guides/development.md, "The three Workers locally": the web app and the store share one
 * `wrangler dev`, the MCP Worker runs in its own, and wrangler's dev registry connects the MCP Worker's `DEMO_STORE`
 * binding to the store.
 * The two Workers must sign and verify `demo_sid` with the same `DEMO_SESSION_SECRET`; a throwaway one is made for
 * each run and handed to both through the environment (`CLOUDFLARE_INCLUDE_PROCESS_ENV`), so no `.dev.vars` is written.
 * `DEMO_COOKIE_DOMAIN` is empty, so the cookies stay host-only on localhost.
 *
 * wrangler's dev registry is global to the machine and keyed by Worker name, so another checkout's `wrangler dev`
 * would answer this run's `DEMO_STORE` binding. `WRANGLER_REGISTRY_PATH` gives this checkout a registry of its own
 * (under `.wrangler/`, which git ignores). `E2E_WEB_PORT` and `E2E_MCP_PORT` move the two servers off 8788 and 8789.
 */
const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 8788);
const MCP_PORT = Number(process.env.E2E_MCP_PORT ?? 8789);

const secret = process.env.DEMO_SESSION_SECRET ?? randomBytes(32).toString("base64");

const workerEnv = {
  CLOUDFLARE_INCLUDE_PROCESS_ENV: "true",
  DEMO_SESSION_SECRET: secret,
  DEMO_COOKIE_DOMAIN: "",
  WRANGLER_REGISTRY_PATH: resolve(".wrangler/e2e-registry"),
};

export default defineConfig({
  testDir: "e2e/workers",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: "list",
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  // Started in this order: the store must be registered before the MCP Worker's writes can reach it.
  webServer: [
    {
      command: `npx wrangler dev -c wrangler.jsonc -c workers/demo-store/wrangler.jsonc --port ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}/dashboard/default`,
      reuseExistingServer: false,
      timeout: 180_000,
      env: workerEnv,
    },
    {
      // `npm run dev:mcp` with the port made configurable.
      command: `npx wrangler dev -c workers/mcp/wrangler.jsonc --port ${MCP_PORT} --infer-origin-from-routes=false`,
      url: `http://localhost:${MCP_PORT}/.well-known/oauth-authorization-server`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: workerEnv,
    },
  ],
});
