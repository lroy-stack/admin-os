# Development

How to run admin-OS on your machine, which commands exist, and what has to pass before a change is merged.

## Requirements

- Node.js 24 (the version in [`.nvmrc`](../../.nvmrc)) and npm.
- For the Cloudflare topology only: a Cloudflare account and `npx wrangler login`. The app itself runs without it.

## Set up

```bash
git clone https://github.com/lroy-stack/admin-os.git
cd admin-os
npm install
npm run dev
```

The app runs at <http://localhost:3000> on the mock adapter, with the seeded demo data of the hospitality preset.

In a fresh clone, run `npx next typegen` once (or start `npm run dev`): it writes the git-ignored `next-env.d.ts` that
`tsc` needs.

### Environment

Every variable is optional for the demo. Copy [`.env.example`](../../.env.example) to `.env.local` to change one; the
file documents each variable, its default and where it is set on Cloudflare. The ones you will reach for first:

| Variable | Effect |
| --- | --- |
| `VERTICAL` | The preset: `hospitality` (default), `salon` or `workshop` |
| `MOCK_CLOCK` | `live` swaps the seeded business moment for real time |
| `MOCK_FAULTS` | Forces an error or a latency on a capability, for example `bookings.list=bookings.not_found` |
| `DATA_STORE` | `durable` keeps each visitor's demo data in the demo store Durable Object instead of memory |

## Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build, and serving it |
| `npm run check` | Biome, layer boundaries (dependency-cruiser), Worker types and Worker bundle check |
| `npm run check:fix` | Biome with fixes (formatting, sorted imports) |
| `npm test` | Unit and contract tests (Vitest) |
| `npm run test:e2e` | Playwright smoke on a production build; fails on any control that does nothing |
| `npm run test:dead-clicks` | Reports every control that does nothing, per route |
| `npm run test:e2e:workers` | Cross-door e2e on the Cloudflare topology (see below) |
| `npm run media` | Rebuilds the README and landing images in `media/` from the running app |
| `npm run preview` | Cloudflare Workers build, served locally on workerd |
| `npm run dev:mcp` | The MCP Worker under `wrangler dev`, at `http://localhost:8789/mcp` |
| `npm run dev:mcp:read-only` | A second, read-only MCP Worker with the public demo tokens, at `http://localhost:8790/mcp` |
| `npm run mcp:stdio` | The MCP server over stdio (use `npm run --silent mcp:stdio`) |
| `npm run mcp:reference` | Regenerates [`docs/mcp/reference.md`](../mcp/reference.md) |
| `npm run probe:consistency` | Checks the durable demo against a running deployment (see below) |
| `npm run eval:mcp` | Agent evals over MCP (see [MCP](mcp.md#agent-evals)) |
| `npm run generate:presets` | Regenerates the theme preset list from `src/ds/styles/presets` |
| `npm run deploy` | See [Deployment](deployment.md) |

## Quality gates

Run these before you commit; CI runs the same on every push to `main` and every pull request.

```bash
npm run check
npx tsc --noEmit
npm test
```

- Run `npm run test:e2e` as well when you change the shell, routing or how a screen loads.
- When a change alters what a screen looks like, run `npm run media` and commit the regenerated images with it.
- When you change a capability or the MCP manifest, run `npm run mcp:reference` before `npm test`; the reference test
  fails while the file is stale.

The pre-commit hook checks the staged files (`scripts/check-staged.mts`), regenerates the theme presets, runs Biome on
the staged files and the layer rules. CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) runs the gates
in one job and the Playwright smoke in twelve parallel shards, each on its own production build inside Playwright's
image (`mcr.microsoft.com/playwright`, at the locked version), so no runner installs a browser.

The test strategy (pure logic and contracts in Vitest, a smoke matrix over roles, viewports and presets in Playwright)
is in [ADR 0008](../adr/0008-testing-contracts-and-smoke.md).

## The three Workers locally

The deployed demo is three Workers: the web app, the demo store (`workers/demo-store`, the Durable Object that holds
each visitor's data) and the MCP server (`workers/mcp`). Locally, the web app and the store share one `wrangler dev`
process and the MCP Worker runs in its own; wrangler's dev registry connects the MCP Worker's `DEMO_STORE` binding to
the store in the first process.

```bash
npx opennextjs-cloudflare build
npx wrangler dev -c wrangler.jsonc -c workers/demo-store/wrangler.jsonc --port 8788
```

Then, in a second terminal:

```bash
npm run dev:mcp
```

- The web app answers at `http://localhost:8788`, MCP at `http://localhost:8789/mcp`.
- Start the web and store process first: until the store is registered, MCP writes answer `transport.unavailable`.
- The public demo tokens are read-only here as in production. To try writes, put `MCP_READ_ONLY=false` in
  `workers/mcp/.dev.vars`.
- The MCP consent page verifies the web app's `demo_sid` cookie (both run on `localhost`, which shares cookies across
  ports), so give `.dev.vars` and `workers/mcp/.dev.vars` the same `DEMO_SESSION_SECRET`.
- `wrangler dev` keeps the OAuth clients and grants in its local KV.

### Cross-door e2e

`npm run test:e2e:workers` builds, starts both processes with a throwaway shared secret and needs no `.dev.vars`. An
agent's held `bookings_cancel` is approved in the web bell, and the booking is cancelled in both doors. It is not part
of `npm run test:e2e` or of CI; set `E2E_WEB_PORT` and `E2E_MCP_PORT` when ports 8788 and 8789 are taken.

### Consistency probes

`npm run probe:consistency` checks a running deployment of the durable demo: one write, then `READS` reads (12 by
default), each over a fresh connection, all of which must see the write. The write is a kernel one, never a module's.

- `-- web` changes the business trade name on the Settings page (`/dashboard/settings`, Edit, Trade name) through the
  real UI in Chromium, then reads the page back.
- `-- mcp` calls `settings_values_update`, which the default policy holds (`awaiting_approval`), then reads the hold
  back with `approvals_get`; it needs `MCP_TOKEN`, an owner token, and the Worker must not be read-only. Nothing is
  applied: the hold expires.
- `-- consent` opens its session with the same trade-name change, and checks that the web and MCP Workers sign
  `demo_sid` with the same `DEMO_SESSION_SECRET`, a trailing newline included. It registers one OAuth client on each
  run, so it only runs when asked for by name.

`BASE_URL` (default `http://localhost:8788`) and `MCP_URL` (default `http://localhost:8789/mcp`) point it at a
deployment, for example:

```bash
BASE_URL=https://admin-os.lr0y.dev MCP_URL=https://mcp.admin-os.lr0y.dev/mcp npm run probe:consistency -- consent
```
