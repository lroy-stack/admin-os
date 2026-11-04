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

Released as [v0.2.0](CHANGELOG.md).

| Area | State |
| --- | --- |
| Shell, glass design system, five themes in light and dark | Done |
| Languages (en / es / de / fr) and currencies (USD / EUR / GBP) | Done |
| Data seam, permissions, roles and approvals | Done (mock adapter) |
| Generic domain contracts (bookings, customers, catalog, staff, resources, notifications) | Done, proven on three vertical seeds |
| Bookings: floor plan, rail, editor, full view, writes with undo | Done (mock data) |
| Customers: directory, search, export, new contact | Done (mock data) |
| Notifications and approvals in the bell | Done |
| MCP server: its own Worker with OAuth, and stdio | Done |
| Showcase screens (mail, chat, projects, tasks, finance and more) | Working on demo-local state |
| Landing page | Done |
| Product Home, customer record, agenda with layers, rooms per vertical | Planned for v1 |

## Tech stack

- **Framework:** Next.js 16 (App Router, React Compiler), React 19, TypeScript, Tailwind CSS v4.
- **UI:** shadcn/ui on Radix UI and Base UI, Lucide icons.
- **Data and forms:** TanStack Table, Zod, React Hook Form, Zustand.
- **Calendar and boards:** FullCalendar 7, dnd-kit.
- **3D floor plan:** three.js.
- **AI:** Model Context Protocol server (official TypeScript SDK).
- **Tooling:** Biome, dependency-cruiser, Vitest, Playwright, Husky.

## Architecture

Code is organised in package-shaped layers with one dependency direction, checked by `npm run check`
(dependency-cruiser). Extracting a layer into its own package is a move, not a rewrite
([ADR 0003](docs/adr/0003-package-shaped-layers.md)).

```text
core ← ds ← engines ← modules ← verticals ← config ← app
```

| Folder | Holds |
| --- | --- |
| `src/core` | Contracts: results and errors, capabilities, the data client, access, approvals, settings, money, i18n, clock, the mock kernel, the MCP projection |
| `src/ds` | Design system: tokens and glass, the window kit (`overlays`, `forms`, `feedback`), shared components, data table, shell, preferences |
| `src/engines` | Mechanisms two screens share (a board, a calendar with layers). None yet: an engine is created on its second consumer |
| `src/modules` | Generic domains: bookings, customers, catalog, notifications, resources, staff |
| `src/verticals` | Presets: hospitality (reference), salon, workshop |
| `src/config` | The composition root: the catalogue, the mock handlers, the adapter, the runtime, the MCP manifest |
| `src/app` | Thin routes; each screen composes its own `_components/` |
| `workers/` | The Cloudflare Workers beside the app: `demo-store` (the durable demo store) and `mcp` (the MCP server) |

`src/components/ui` is shadcn (`radix-nova`), never edited; `src/lib` and `src/hooks` hold small shared utilities.

### Who owns a control

Every control on a screen does something, and its action lives in the lowest layer that owns the job; the route only
composes. The e2e fails on any control that does nothing (`e2e/smoke/dead-clicks.spec.ts`).

| The control… | Its owner |
| --- | --- |
| reads or changes business data | a capability of a module in `src/modules`, called through `client.call` |
| runs a mechanism two screens share | an engine in `src/engines`, fed by a module through a data contract |
| opens a window, confirms, undoes, guards leaving | the window kit, chosen by the job ([ADR 0015](docs/adr/0015-window-rules.md)) |
| belongs to a showcase-only screen | the screen, with local demo state and kit windows; no capability, no MCP tool |
| has no owner yet | nobody: it is removed, never left dead |

### Building on the template

Each path names the files to touch, in order, and the decision record behind it. In a fresh clone, run
`npx next typegen` once (or `npm run dev`): it writes the git-ignored `next-env.d.ts` that `tsc` needs. Then
`npx tsc --noEmit`, `npm test` and `npm run check` tell you what is still missing; `npm run check:fix` sorts imports.

**Add a module** ([ADR 0004](docs/adr/0004-vertical-presets-and-generic-domains.md),
[0005](docs/adr/0005-data-seam.md), [0006](docs/adr/0006-registries-permissions-navigation.md)). The smallest
complete example is `src/modules/notifications`.

1. `src/modules/<domain>/schema.ts`: zod schemas for the records, inputs and outputs. Money is integer minor units
   (`moneySchema`), phones are E.164.
2. `capabilities.ts`: one `defineCapability` per operation, with an id `<domain>.<verb>`, a `summary` an agent can act
   on, `input`, `output`, a `permission` such as `read:<domain>`, an `effect` (`read`, `write` or `destructive`) and a
   `riskTier`; writes also declare `change` and `idempotency`. Collect them in one `<domain>Capabilities` record;
   `index.ts` re-exports the capabilities and the schemas.
3. `mock.ts`: a `mockHandler` per capability over the demo data, exported from `server.ts` with `messages.ts` (its
   error and label texts in en, es, de and fr).
4. Register a new module in `src/config`: its `<domain>Capabilities` in `SOURCE_CATALOGS` (`catalog.ts`) and its
   handlers in `MOCK_HANDLERS` (`demo-kernel.ts`). A capability added to an existing module needs neither, since the
   module's record is already there; a capability that takes required input also gives its smallest valid input to
   `inputFor` (`src/config/adapter-contract.testkit.ts`), so the adapter contract can call it.
5. Classify every capability for MCP, as the "Expose a capability to MCP" path below says. Until you do, the
   catalogue does not compile.
6. Turn it on: add the module id to the `modules` of each preset that offers it. Roles get its permissions from their
   rule; a module that is off grants nothing.
7. Test it at two levels. In the module (`<domain>.test.ts`), test the schemas and handlers on an inline fixture and
   run `assertDictionaryParity` over its messages; a module sits below the presets and cannot import their seeds. On a
   preset's seed, test it in `src/config/<domain>.test.ts`, which builds a client with
   `createClient(CATALOG, getAdapter({ vertical, sessionId }), …)` as `src/config/customers.test.ts` does.

**Add a preset** ([ADR 0004](docs/adr/0004-vertical-presets-and-generic-domains.md)). Copy `src/verticals/salon`:
`index.ts` lists the modules, the nav, the roles, the typed `ext` slots, the setting defaults and the `leakTerms`
that must never reach the generic layers; `server.ts` and `seed.ts` hold the vocabulary and the demo data. Add it to
`VERTICALS` (`src/config/vertical.ts`) and `DEMO` (`src/config/demo-kernel.ts`); the leak test and the seed tests
check it.

**Wire a control** ([ADR 0005](docs/adr/0005-data-seam.md), [0007](docs/adr/0007-i18n-typed-dictionaries.md),
[0015](docs/adr/0015-window-rules.md)). A read happens on the server: `const { client } = await getRuntime()`, then
`client.call("<capability>", input)`, and the screen shows the outcome through `ReadState` (an error is never an
empty list). A write is a Server Action that calls `runWrite("<capability>", input, attemptKey)`
(`src/config/write-action.server.ts`), run from the client with `useCapabilityAction` inside the window the job calls
for; add the action to the inventory in `src/config/server-actions.test.ts`. Hide what the actor cannot do with
`can()`, and take every word from the screen's dictionary. `src/app/(main)/dashboard/customers` is the reference.

**Swap the adapter** ([ADR 0005](docs/adr/0005-data-seam.md)). The app reaches data only through the `Adapter`
interface (`src/core/client/index.ts`), one `dispatch` per capability call. Implement it for your backend, select it
by `DATA_ADAPTER` in `getAdapter` (`src/config/data.server.ts`), and run the shared contract against it with
`describeAdapterContract` (`src/config/adapter-contract.testkit.ts`), as `src/config/data.server.test.ts` does for the
in-memory one.

**Expose a capability to MCP** ([ADR 0009](docs/adr/0009-mcp-server.md),
[0016](docs/adr/0016-mcp-server-as-its-own-product.md)).

1. Classify it in `MCP_MANIFEST` (`src/config/mcp-manifest.ts`): `expose: true` with the `title` clients show, or
   `uiOnly` with the reason. A small read needs nothing else. A list tool returns `concise` rows, `ids` names the tools
   that list valid values for an id field, and `untrusted` marks free text people typed.
2. Pin what an agent will see, its annotations, tier and key requirement, in the `PINNED` table of
   `src/config/mcp.server.test.ts`; the test lists every tool in name order and fails on a tool it does not know.
3. Run `npm run mcp:reference` to regenerate [`docs/mcp/reference.md`](docs/mcp/reference.md) before `npm test`:
   the reference test fails while the file is stale.

The tool's input, output and permission are the capability's own, and a write the policy holds waits for a person in
the bell. The MCP Worker (`workers/mcp`) serves it over Streamable HTTP and `npm run mcp:stdio` over stdio.

Testing follows [ADR 0008](docs/adr/0008-testing-contracts-and-smoke.md); every decision record is in
[`docs/adr`](docs/adr).

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
| `npm run deploy` | Checks the public URL and the session secret, builds for Cloudflare Workers, deploys the demo store Worker, the MCP Worker, then the app |
| `npm run dev:mcp` | The MCP Worker under `wrangler dev`, at `http://localhost:8789/mcp` |
| `npm run dev:mcp:read-only` | A second, read-only MCP Worker with the public demo tokens, at `http://localhost:8790/mcp` |
| `npm run eval:mcp` | Agent evals: the golden MCP tasks through headless Claude Code (see "MCP") |
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

`npm run test:e2e:workers` runs the cross-door e2e on demand (it builds, starts both processes itself with a
throwaway shared secret and needs no `.dev.vars`): an agent's held `bookings_cancel` is approved in the web bell and
the booking is cancelled in both doors. It is not part of `npm run test:e2e` or of CI; set `E2E_WEB_PORT` and
`E2E_MCP_PORT` when 8788 and 8789 are taken.

`npm run probe:consistency -- consent` checks that the web and MCP Workers sign with the same
`DEMO_SESSION_SECRET`, a trailing newline included: a web write yields a `demo_sid`, a client registers and opens
`/authorize` with it, and the renewed cookie must carry the same session id. Against the deployed demo:
`BASE_URL=https://admin-os.lr0y.dev MCP_URL=https://mcp.admin-os.lr0y.dev/mcp npm run probe:consistency -- consent`.

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
   failed build never leaves the store ahead of the app. First give the key that signs the demo session cookie to the
   web Worker and to the MCP Worker, whose consent page verifies the same cookie, so both take one value (at least 32
   characters; `npm run deploy` stops when either Worker lacks it, and wrangler offers to create a Worker that does not
   exist yet):

   ```bash
   value="$(openssl rand -base64 32)"
   printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c wrangler.jsonc
   printf %s "$value" | npx wrangler secret put DEMO_SESSION_SECRET -c workers/mcp/wrangler.jsonc
   ```

   Cloudflare never shows a secret again, so run the three lines together. The MCP Worker keeps OAuth clients and
   grants in a KV namespace bound as `OAUTH_KV`: create it with `npx wrangler kv namespace create OAUTH_KV` and put
   its `id` in [`workers/mcp/wrangler.jsonc`](workers/mcp/wrangler.jsonc), or let `wrangler deploy` provision it.

   To keep a visitor's data in the memory of each instance instead, remove `DATA_STORE`, `durable_objects` and
   `DEMO_SESSION_SECRET`; it then resets when Cloudflare recycles the instance.
4. Build and deploy with your public URL, which the build writes into canonical, Open Graph and sitemap links
   (`npm run deploy` stops unless it is a public https URL):

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

Agent evals: `npm run eval:mcp` runs [`evals/mcp/golden.json`](evals/mcp/golden.json) through headless Claude Code
(`EVAL_MODEL`, default `sonnet`), grades each trial from its tool results and a follow-up read of the state, and
writes pass rates and cost to `evals/mcp/results/`. It spends your Claude usage and starts nothing: run the Workers as
in "The three Workers locally", with `MCP_TOKENS=eval-owner-0001:owner` and `MCP_READ_ONLY=false` in
`workers/mcp/.dev.vars`, plus `npm run dev:mcp:read-only`.

## Credits

admin-OS started from [next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) by
Mohammed Arham Khan (MIT), whose shell, screens and theme system it builds on.

## License

[MIT](LICENSE)
