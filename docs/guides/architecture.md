# Architecture

admin-OS is one Next.js app and two Cloudflare Workers over a single contract: every screen and every MCP tool reads
and writes through typed **capabilities**, answered by an **adapter**. This page is the map; the reasons behind each
decision are in the [decision records](../adr).

## Layers

Code is organised in package-shaped layers with one dependency direction, checked by `npm run check`
(dependency-cruiser). Extracting a layer into its own package is a move, not a rewrite
([ADR 0003](../adr/0003-package-shaped-layers.md)).

```text
core ← ds ← engines ← modules ← verticals ← config ← app
```

| Folder | Holds |
| --- | --- |
| `src/core` | Contracts: results and errors, capabilities, the data client, access, approvals, settings, money, i18n, clock, the mock kernel, the MCP projection |
| `src/ds` | Design system: tokens and glass, the window kit (`overlays`, `forms`, `feedback`), shared components, data table, shell, preferences |
| `src/engines` | Mechanisms two screens share (a board, a calendar with layers). None yet: an engine is created with its second consumer |
| `src/modules` | Generic domains: bookings, customers, catalog, notifications, resources, staff |
| `src/verticals` | Presets: hospitality (the reference), salon, workshop |
| `src/config` | The composition root: the catalogue, the mock handlers, the adapter, the runtime, the MCP manifest |
| `src/app` | Thin routes; each screen composes its own `_components/` |
| `workers/` | The Workers beside the app: `demo-store` (the durable demo store) and `mcp` (the MCP server) |

`src/components/ui` is shadcn (`radix-nova`) and is never edited; `src/lib` and `src/hooks` hold small shared
utilities.

## The data seam

- **Capabilities** describe each operation once: id, summary, input and output schemas, permission, effect (`read`,
  `write`, `destructive`), risk tier and, for writes, the kind of change and its idempotency
  ([ADR 0005](../adr/0005-data-seam.md)).
- **One client** calls them on the server. It validates the input and the output, carries the actor, and retries a
  read or a keyed write once after a transport failure.
- **An adapter** answers them. The mock adapter ships for the demo: a seeded business clock and a copy of the demo data
  per visitor, kept in a Durable Object on Cloudflare. A real backend implements the same `Adapter` interface.
- **Permissions** come from roles defined as rules over the catalogue (owner, manager, staff). The adapter checks every
  call; the UI only hides what the actor cannot do ([ADR 0006](../adr/0006-registries-permissions-navigation.md)).
- **Approvals.** A policy holds an assistant's writes for a person, who approves or rejects them from the bell.
- **Settings.** Business rules and the business's own details are settings: a module declares each one with its
  schema, default and write permission, a preset sets its values, and a demo session keeps the visitor's changes over
  them (`settings.values.update`, owner only). The Settings page (`/dashboard/settings`) shows the business details
  and the invoice prints them. The approval policy is a setting no assistant can change
  ([ADR 0006](../adr/0006-registries-permissions-navigation.md)).

## Presets

A preset is a business type over the generic modules: which modules are on, the navigation, the roles, typed
extension slots, setting defaults (its demo company among them), vocabulary and seed data ([ADR 0004](../adr/0004-vertical-presets-and-generic-domains.md)).
Hospitality says *tables* and *covers*, the salon *chairs*, the workshop *bays*; the modules underneath are the same, and
a leak test keeps each preset's words out of the generic layers.

## Who owns a control

Every control on a screen does something, and its action lives in the lowest layer that owns the job; the route only
composes. The e2e smoke fails on any control that does nothing (`e2e/smoke/dead-clicks.spec.ts`).

| The control… | Its owner |
| --- | --- |
| reads or changes business data | a capability of a module in `src/modules`, called through `client.call` |
| runs a mechanism two screens share | an engine in `src/engines`, fed by a module through a data contract |
| opens a window, confirms, undoes, guards leaving | the window kit, chosen by the job ([ADR 0015](../adr/0015-window-rules.md)) |
| belongs to a showcase-only screen | the screen, with local demo state and kit windows; no capability, no MCP tool |
| has no owner yet | nobody: it is removed, never left dead |

## The MCP server

The MCP server is a projection of the same catalogue through the same client, so a tool has the capability's input,
output and permission ([ADR 0009](../adr/0009-mcp-server.md)). It runs as its own Worker over the durable demo store,
with OAuth and scoped access ([ADR 0016](../adr/0016-mcp-server-as-its-own-product.md)). Using it is covered in
[MCP](mcp.md).

## Interface

- **Material.** Liquid glass in five themes, light and dark, with an opaque fallback for reduced transparency
  ([themes](../design/liquid-glass-themes.md)).
- **Windows.** Each job has its window from one kit: confirm, quick dialog, form dialog, record panel, picker
  ([ADR 0015](../adr/0015-window-rules.md)).
- **Languages.** Four complete locales in typed dictionaries, `Intl` for dates, numbers and currency, and one term per
  concept in each language ([ADR 0007](../adr/0007-i18n-typed-dictionaries.md), [glossary](../i18n/glossary.md)).
- **Floor plan.** One three.js scene with an orthographic camera for 2D, 2.5D and 3D
  ([ADR 0001](../adr/0001-floor-plan-rendering.md)).
