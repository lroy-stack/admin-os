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
| `src/core` | Contracts: results and errors, capabilities, the data client, access, approvals, settings, money, i18n, clock, the mock kernel, the MCP projection, the module manifest (`defineModule`) and the view kinds (`defineViewKind`) |
| `src/ds` | Design system: tokens and glass, the window kit (`overlays`, `forms`, `feedback`), shared components, data table, shell, preferences |
| `src/engines` | Mechanisms two screens share (a board, a calendar with layers). None yet: an engine is created with its second consumer |
| `src/modules` | Generic domains, one folder each: bookings, catalog, customers, inventory, notifications, parties, resources, staff |
| `src/verticals` | Presets: hospitality (the reference), salon, workshop |
| `src/config` | The composition root: the catalogue, the mock handlers, the adapter, the runtime, the MCP manifest, the bell's server side, and the four lists generated from the module folders |
| `src/app` | Thin routes; each screen composes its own `_components/` |
| `workers/` | The Workers beside the app: `demo-store` (the durable demo store) and `mcp` (the MCP server) |

`src/components/ui` is shadcn (`radix-nova`) and is never edited; `src/lib` and `src/hooks` hold small shared
utilities.

## Modules: the seam

A module is a folder in `src/modules` with a manifest, and `npm run generate:modules` composes the app from the folders
that are present ([ADR 0017](../adr/0017-a-module-is-a-folder.md)). The manifest is data only, because the Workers
import it and must never reach web code. It declares the module's capabilities, settings, MCP noun and id sources,
seed collections, references to other modules, view kinds, bell feeds, route slots and the paths outside the folder
that go with it (`owns`).

- **Generated lists.** The generator writes `src/config/modules.generated.ts` (manifests and the dependency graph),
  `modules.server.generated.ts` (server halves), `modules.client.generated.ts` (view renderers) and
  `modules.slots.generated.ts` (slot fills, apart so a route that takes a fill does not bundle the renderers). They
  are committed; a staleness test fails while one is out of date and names the command.
- **Dependencies are derived.** The generator reads the imports of each module, so a module that needs another is
  refused when it is missing. A reference to another module's data that is optional reads an absent module as empty
  (`collectionOf`); a handler never throws because a module is not installed.
- **The boundary.** Outside `src/modules`, only the generated lists, the presets and the paths a module `owns` import a
  module (dependency-cruiser rule `modules-only-through-composition`).
- **Slots.** A route declares named slots and a module fills them from its manifest: the customers module fills the
  bookings route's guest lookup, guest search and new-contact fields, so the bookings route imports no customers code.
  Without a filler, the route renders nothing for the slot.
- **Views.** The Products page renders the view kinds modules declare (`catalog.collection`, `inventory.stock`,
  `inventory.orders`) through the generated client map, in the order each preset lists them
  ([ADR 0018](../adr/0018-product-views-and-inventory.md)).
- **Installed and enabled.** A module is installed when its folder exists; a preset enables the installed modules it
  lists, and a disabled module grants nothing.

How to add a module, fill a route slot, add a product view or add a bell feed is in
[Building on the template](extending.md).

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
- **Approvals.** A policy holds an assistant's writes for a person, who approves or rejects them from the bell. The
  approval rows come from the kernel, not from a module, so they stay when the notifications module is removed.
- **Settings.** Business rules and the business's own details are settings: a module declares each one with its
  schema, default and write permission, a preset sets its values, and a demo session keeps the visitor's changes over
  them (`settings.values.update`, owner only). The Settings page (`/dashboard/settings`) shows the business details
  and the invoice prints them. The approval policy is a setting no assistant can change
  ([ADR 0006](../adr/0006-registries-permissions-navigation.md)).

## The bell

The bell is the shell's. It shows the kernel's pending approvals, for an actor who may review them (`review:approvals`; approving and
rejecting need `decide:approvals`), and the feeds the
installed modules contribute (the `notifications` module's inbox is one), through one Server Action and
`src/config/bell.server.ts`. A feed names the module's own list, unread, read and read-all capabilities, so the shell
imports no module and removing `notifications` leaves the bell with approvals only
([ADR 0017](../adr/0017-a-module-is-a-folder.md), "The bell").

## Presets

A preset is a business type over the generic modules: which modules are on, the navigation, the roles, typed
extension slots, setting defaults (its demo company among them), the views of the Products page, vocabulary and seed data ([ADR 0004](../adr/0004-vertical-presets-and-generic-domains.md)).
Hospitality says *tables* and *covers*, the salon *chairs*, the workshop *bays*; the modules underneath are the same, and
a leak test keeps each preset's words out of the generic layers. Each preset seeds its own products, stock, supplier
orders and fictitious clients and suppliers.

## Parties and products

- **Parties** are who a business invoices and buys from: a legal name, a tax ID, a fiscal address and the roles
  `client` and `supplier`. They are apart from `customers`, the people who book, and are not linked to them. The
  module has no page and no navigation entry; the invoice's "Bill to" lists the client parties, and the MCP tools
  list, read, create and update them ([ADR 0019](../adr/0019-billing-parties.md)).
- **Products** are `catalog` for what a business sells and `inventory` for what it keeps and buys (stock and supplier
  orders, read only). Both are views of the Products page, which sits in the tools rail. Inventory reads supplier names
  from `parties`, and shows none when `parties` is not installed ([ADR 0018](../adr/0018-product-views-and-inventory.md)).

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
with OAuth and scoped access ([ADR 0016](../adr/0016-mcp-server-as-its-own-product.md)). Its manifest and its
instructions are composed from the installed modules' manifests, so a removed module takes its tools with it. Using it
is covered in [MCP](mcp.md).

## Interface

- **Material.** Liquid glass in five themes, light and dark, with an opaque fallback for reduced transparency
  ([themes](../design/liquid-glass-themes.md)).
- **Windows.** Each job has its window from one kit: confirm, quick dialog, form dialog, record panel, picker
  ([ADR 0015](../adr/0015-window-rules.md)).
- **Languages.** Four complete locales in typed dictionaries, `Intl` for dates, numbers and currency, and one term per
  concept in each language ([ADR 0007](../adr/0007-i18n-typed-dictionaries.md), [glossary](../i18n/glossary.md)).
- **Floor plan.** One three.js scene with an orthographic camera for 2D, 2.5D and 3D
  ([ADR 0001](../adr/0001-floor-plan-rendering.md)).
