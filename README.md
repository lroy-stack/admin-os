# admin-OS

**An open-source management dashboard for small businesses.** It is built for restaurants first, and it is designed
so that a hair salon or a car repair workshop can run on the same modules. No AI slop, no over-engineering: well
designed, reusable at every level, and ready to be managed by an AI assistant through its own MCP server.

**[Open the live demo →](https://admin-os.lr0y.dev)** It runs on Cloudflare Workers with the demo data
of the mock adapter, in English, Spanish, German or French.

> [!NOTE]
> admin-OS is in active development towards its first release (`v0.1`). Some modules below are built, others are
> in progress. See [Status](#status). The screenshots show the demo data that ships with the mock adapter.

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/bookings-dark.webp"><img alt="Reservations screen: the live floor plan in 2.5D beside the arrivals rail" src="media/desktop/bookings-light.webp" width="100%"></picture>
</p>

## See it in use

**Moving around.** The top bar holds the business areas, the rail on the left the tools.

<img alt="Moving through Home, Reservations, Pipeline, Schedule, Email and Chat" src="media/flows/tour.webp" width="100%">

**The bookings room.** The floor plan switches between 2D, 2.5D and 3D; a table opens its booking, and the same
service reads as an agenda or a list.

<img alt="Floor plan switching camera angles, a table opening its booking, then the agenda and list views" src="media/flows/room.webp" width="100%">

**Themes, modes and languages.** Five liquid-glass themes in light and dark, and the interface in English, Spanish,
German and French.

<img alt="Preferences panel cycling the Ember, Rose, Tide, Cobalt and Lime themes, light and dark mode, then Spanish, German, French and English" src="media/flows/preferences.webp" width="100%">

**On a phone.** The same screens, with a bottom dock and bottom sheets.

<table>
  <tr>
    <td width="33%"><img alt="Phone: scrolling Home, opening Reservations, tapping a table and switching to the agenda" src="media/flows/phone.webp" width="100%"></td>
    <td width="33%"><picture><source media="(prefers-color-scheme: dark)" srcset="media/devices/phone-bookings-dark.webp"><img alt="Phone: today's reservations" src="media/devices/phone-bookings-light.webp" width="100%"></picture></td>
    <td width="33%"><picture><source media="(prefers-color-scheme: dark)" srcset="media/devices/phone-calendar-dark.webp"><img alt="Phone: team schedule" src="media/devices/phone-calendar-light.webp" width="100%"></picture></td>
  </tr>
</table>

## Screens

Desktop, 1440 × 900. The images follow your GitHub theme (light or dark).

<table>
  <tr>
    <td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/home-dark.webp"><img alt="Home: sales overview with revenue, quota, stage mix and hot deals" src="media/desktop/home-light.webp" width="100%"></picture></td>
    <td width="50%"><img alt="Reservations: the floor plan in 3D" src="media/desktop/bookings-3d-dark.webp" width="100%"></td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/pipeline-dark.webp"><img alt="Pipeline: deals on a board by stage" src="media/desktop/pipeline-light.webp" width="100%"></picture></td>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/calendar-dark.webp"><img alt="Schedule: the team calendar with what closes soon" src="media/desktop/calendar-light.webp" width="100%"></picture></td>
  </tr>
  <tr>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/mail-dark.webp"><img alt="Email: folders, inbox and an open message" src="media/desktop/mail-light.webp" width="100%"></picture></td>
    <td><picture><source media="(prefers-color-scheme: dark)" srcset="media/desktop/chat-dark.webp"><img alt="Chat: channels, conversations and a thread with a reply box" src="media/desktop/chat-light.webp" width="100%"></picture></td>
  </tr>
</table>

Tablet, 834 × 1194.

<table>
  <tr>
    <td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="media/devices/tablet-bookings-dark.webp"><img alt="Tablet: reservations with the arrivals rail and the floor plan" src="media/devices/tablet-bookings-light.webp" width="100%"></picture></td>
    <td width="50%"><picture><source media="(prefers-color-scheme: dark)" srcset="media/devices/tablet-home-dark.webp"><img alt="Tablet: home overview" src="media/devices/tablet-home-light.webp" width="100%"></picture></td>
  </tr>
</table>

Every image is generated from the running app by `npm run media`
([`e2e/media/readme.capture.ts`](e2e/media/readme.capture.ts)), so it stays in step with the code.

## What it does

- **Bookings with a live floor plan.**
  - The room renders in 2D, 2.5D or 3D with table states you can read from across the room.
  - An arrivals rail is planned by time slot.
  - A room editor handles several levels.
  - A full-screen service view gives the floor and the rail the whole screen.
- **Liquid-glass interface.** A glass shell with five themes (Lime, Ember, Rose, Tide, Cobalt), each in light and
  dark and checked against WCAG contrast, with layout controls and a responsive layout that works on phones and
  touch screens.
- **Vertical presets.** One codebase serves different businesses: hospitality (tables and covers), salons (chairs and
  services) and workshops (bays and vehicles). Generic domain modules sit underneath and only the vocabulary and seed
  data change.
- **Four languages, three currencies.** English, Spanish, German and French, with complete dictionaries that lint
  enforces, and USD, EUR or GBP as the business currency.
- **Roles and permissions.** Owner, manager and staff roles with typed permissions that gate every capability, the
  MCP tools and the navigation.
- **Pluggable data layer.** Every screen reads and writes through typed capabilities. A mock adapter ships for
  demos, with its own data per visitor; a real backend replaces one adapter.
- **MCP server**, so any MCP-capable AI assistant can operate the dashboard with the same capabilities and
  permissions as the screens.

## Status

| Area | State |
| --- | --- |
| Shell, glass design system, five themes in light and dark | Done |
| Bookings: floor plan, rail, editor, full view | Done (mock data) |
| Generic domain contracts (bookings, customers, catalog, staff, resources) | Done, proven on three vertical seeds |
| Data seam, permissions and roles | Done (mock adapter) |
| Languages (en / es / de / fr) and currencies (USD / EUR / GBP) | Done |
| MCP server (Streamable HTTP and stdio) | Done |
| Customers CRM, agenda, team, catalog, messaging, tasks | Planned for `v0.1` |
| Landing page | In progress |

## Tech stack

- **Framework:** Next.js 16 (App Router, React Compiler), React 19, TypeScript, Tailwind CSS v4.
- **UI:** shadcn/ui on Radix UI and Base UI, Lucide icons.
- **Data and forms:** TanStack Table, Zod, React Hook Form, Zustand.
- **Calendar and boards:** FullCalendar 7, dnd-kit.
- **3D floor plan:** three.js.
- **AI:** Model Context Protocol server (official TypeScript SDK).
- **Tooling:** Biome, dependency-cruiser, Vitest, Playwright, Husky.

## Architecture

Code is organised in package-shaped layers with one dependency direction, enforced by lint. Extracting a layer into
its own package is a move, not a rewrite.

```text
core ← ds ← engines ← modules ← verticals ← config ← app
```

| Folder | Holds |
| --- | --- |
| `src/core` | Contracts: results and errors, capabilities, money, i18n, clock, channels |
| `src/ds` | Design system: tokens, glass styles, presets, shared components, shell, preferences |
| `src/modules` | Generic domains: bookings, customers, catalog, staff, resources |
| `src/verticals` | Presets: hospitality (reference), salon, workshop |
| `src/app` | Thin routes |

Every dialog, sheet, panel and confirmation comes from one window kit (`src/ds/overlays`, `src/ds/forms`,
`src/ds/feedback`), chosen by the job as [ADR 0015](docs/adr/0015-window-rules.md) says, and the e2e fails on any control
that does nothing (`e2e/smoke/dead-clicks.spec.ts`).

Architecture decisions live in [`docs/adr`](docs/adr).

## Getting started

```bash
git clone https://github.com/lroy-stack/admin-os.git
cd admin-os
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit and contract tests (Vitest) |
| `npm run test:e2e` | Shell smoke on a production build (Playwright) |
| `npm run check` | Lint, format and layer boundaries (Biome, dependency-cruiser) |
| `npm run media` | Rebuilds the screenshots and recordings in `media/` |
| `npm run preview` | Cloudflare Workers build, served locally on workerd |
| `npm run deploy` | Checks the session secret, builds for Cloudflare Workers, deploys the demo store Worker, the MCP Worker, then the app |
| `npm run dev:mcp` | The MCP Worker under `wrangler dev`, at `http://localhost:8789/mcp` |
| `npm run mcp:stdio` | MCP server over stdio |

### The three Workers locally

The deployed demo is three Workers: the web app, the demo store (`workers/demo-store`, the Durable Object that holds
each visitor's data) and the MCP server (`workers/mcp`). Locally the web app and the store share one `wrangler dev`
process and the MCP Worker runs in its own; wrangler's dev registry connects the MCP Worker's `DEMO_STORE` binding to
the store in the first process.

```bash
npx opennextjs-cloudflare build
npx wrangler dev -c wrangler.jsonc -c workers/demo-store/wrangler.jsonc --port 8788   # web and store
npm run dev:mcp                                                                       # MCP, in a second terminal
```

The web app answers at `http://localhost:8788`, MCP at `http://localhost:8789/mcp`. Start the web and store process
first: until the store is registered, MCP writes answer `transport.unavailable`. The public demo tokens are read-only
there as in production; to try writes, put `MCP_READ_ONLY=false` in `workers/mcp/.dev.vars`. The MCP Worker's consent
page verifies the web app's `demo_sid` cookie (both run on `localhost`, which shares cookies across ports), so give
`.dev.vars` and `workers/mcp/.dev.vars` the same `DEMO_SESSION_SECRET`; `wrangler dev` keeps the OAuth clients and
grants in its local KV.

## Deploy

The live demo runs on Cloudflare Workers through the [OpenNext adapter](https://opennext.js.org/cloudflare). To
deploy your own:

1. In [`wrangler.jsonc`](wrangler.jsonc), rename the worker (its `name` and the `WORKER_SELF_REFERENCE` service) and
   replace the custom domain with a hostname on one of your Cloudflare zones. Without a zone, remove `routes` and set
   `workers_dev` to `true` to serve it on your workers.dev subdomain. Do the same for the MCP Worker in
   [`workers/mcp/wrangler.jsonc`](workers/mcp/wrangler.jsonc) (`mcp.admin-os.lr0y.dev` here); Cloudflare creates the
   DNS record and the certificate of a custom domain on the first deploy.
2. Log in once with `npx wrangler login`.
3. Visitors' demo data lives in a Durable Object of its own Worker (`workers/demo-store`), which `npm run deploy`
   deploys right after the build, then the MCP Worker (`workers/mcp`), which binds the same store, then the app; a
   failed build never leaves the store ahead of the app. Give the web Worker the key
   that signs the demo session cookie first (at least 32 characters; `npm run deploy` stops when it is missing, and
   wrangler offers to create the Worker if it does not exist yet):

   ```bash
   openssl rand -base64 32 | npx wrangler secret put DEMO_SESSION_SECRET
   ```

   The MCP Worker's consent page verifies the same cookie, so give it the same value
   (`npx wrangler secret put DEMO_SESSION_SECRET -c workers/mcp/wrangler.jsonc`). It keeps OAuth clients and grants in
   a KV namespace bound as `OAUTH_KV`: create it with `npx wrangler kv namespace create OAUTH_KV` and put its `id` in
   [`workers/mcp/wrangler.jsonc`](workers/mcp/wrangler.jsonc), or let `wrangler deploy` provision it.

   To keep a visitor's data in the memory of each instance instead, remove `DATA_STORE`, `durable_objects` and
   `DEMO_SESSION_SECRET`; it then resets when Cloudflare recycles the instance.
4. Build and deploy with your public URL, which the build writes into canonical and Open Graph links:

   ```bash
   NEXT_PUBLIC_SITE_URL=https://admin-os.example.com npm run deploy
   ```

On the mock adapter the MCP Worker accepts the public demo tokens; set your own with
`npx wrangler secret put MCP_TOKENS -c workers/mcp/wrangler.jsonc`. The web app alone runs on any Node.js host too
(`npm run build && npm run start`); MCP then runs over stdio, or as the MCP Worker on Cloudflare.

## MCP

The same capabilities the screens use are MCP tools, filtered by the caller's role
([ADR 0009](docs/adr/0009-mcp-server.md)); every tool, per preset and role, is in the generated
[MCP reference](docs/mcp/reference.md). The server is its own Worker, `workers/mcp`
([ADR 0016](docs/adr/0016-mcp-server-as-its-own-product.md)), and two transports serve it:

- **Streamable HTTP** at `https://mcp.admin-os.lr0y.dev/mcp` (locally `http://localhost:8789/mcp`, see "The three
  Workers locally"), with **OAuth**: the Worker is its own authorization server. A client that connects without a
  token is sent to a consent page on the Worker, which shows who asks and what it may do; the grant acts on **your
  own demo data**, the session the web demo keeps in your browser (or a new one), as the role you picked there
  (owner by default). **Reading and changing are separate grants**: `read` is the default and lists read tools only;
  when the agent calls a write, it gets `403 insufficient_scope` and the client asks you again, and the page then
  offers changes as a choice of its own. `https://mcp.admin-os.lr0y.dev/grants` lists the apps connected to your
  browser's demo data and revokes any of them. The connection also accepts bearer tokens: `MCP_TOKENS` maps tokens
  to roles (see [`.env.example`](.env.example)); on the mock adapter, with `MCP_TOKENS` unset, the demo tokens
  `demo-owner-token`, `demo-manager-token` and `demo-staff-token` work, each on demo data of its own. Those public
  tokens are **read-only**: anyone holds them, so they list and run read tools only. Your own `MCP_TOKENS` keep the
  writes; `MCP_READ_ONLY=true` makes every connection read-only, grants included. Requests are rate-limited
  per grant, per token and client IP for the public tokens, and per client IP on the OAuth endpoints and before a
  token is checked (`429` with `Retry-After`), and a browser page may call it only from the demo's own origin or
  `claude.ai`.
- **stdio** with `npm run --silent mcp:stdio`. `MCP_ROLE` picks the role (default `staff`), `VERTICAL` the preset,
  and `MCP_SCOPES` what the process may do, as a grant's scopes over HTTP: `read` by default, `read write` for the
  role's writes too.

The web app's old endpoint, `https://admin-os.lr0y.dev/api/mcp`, answers `410` with the new URL; add the server again
at `https://mcp.admin-os.lr0y.dev/mcp`.

Create and add tools take a required `idempotencyKey` argument: a new UUID for each operation, the same one to retry
it safely. Other writes take no key and are safe to repeat. Each tool's annotations say whether it only reads,
whether it can overwrite or remove data, and whether a repeat is safe.

The server's `serverInfo.version` is a hash of its tool list, so it changes whenever a tool does. If a client keeps
showing an old list after an update, reconnect it (in Claude Code, `/mcp`, then reconnect `admin-os`).

Claude Code: add the server, then run `/mcp` in a session and authenticate `admin-os`; the consent page opens in your
browser. Open the demo at `https://admin-os.lr0y.dev` in the same browser first if the agent should act on the data
you see there. Asking again after a `403 insufficient_scope` is the client's part of the protocol; a client that does
not keeps its `read` grant.

```bash
claude mcp add --transport http admin-os https://mcp.admin-os.lr0y.dev/mcp
# or with a public demo token instead of OAuth (read-only)
claude mcp add --transport http admin-os https://mcp.admin-os.lr0y.dev/mcp --header "Authorization: Bearer demo-staff-token"
# or over stdio, from the repository root, with writes
claude mcp add --scope project admin-os -e MCP_ROLE=owner -e "MCP_SCOPES=read write" -- npm run --silent mcp:stdio
```

claude.ai: add a custom connector with the URL `https://mcp.admin-os.lr0y.dev/mcp` and connect it; Claude registers
itself and opens the same consent page.

Claude Desktop (`claude_desktop_config.json`), with the absolute path of your clone:

```json
{
  "mcpServers": {
    "admin-os": {
      "command": "npm",
      "args": ["--prefix", "/absolute/path/to/admin-os", "run", "--silent", "mcp:stdio"],
      "env": { "MCP_ROLE": "owner", "MCP_SCOPES": "read write" }
    }
  }
}
```

Keep `--silent`: without it npm prints its banner on stdout, which carries the protocol.

## Credits

admin-OS started from [next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) by
Mohammed Arham Khan (MIT), whose shell, screens and theme system it builds on.

## License

[MIT](LICENSE)
