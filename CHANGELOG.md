# Changelog

All notable changes to admin-OS are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Business settings a session changes.** The kernel capability `settings.values.update` (owner only) sets
  settings in the visitor's demo session, checked against each setting's schema and permission. The first editable
  section is the business details (`business.profile`, `business.payment`, `business.invoicing`); each preset ships
  a demo company. Over MCP an assistant's change waits for the owner's approval, and the approval policy is never
  changed this way.
- **Products by business type.** The Products page (`/dashboard/products`, in the tools rail) shows each preset its own
  views, switched with the segmented control: hospitality the menu and the shop, the salon the shop and the stock, the
  workshop the parts and the supplier orders. Each preset's catalog gained shop or parts items for them, and
  `catalog_list` takes an optional `categoryIds` filter (1 to 20 ids) to read one collection.
- **Stock and supplier orders.** A new `inventory` module keeps what a business holds and buys, read only: stock rows
  with their quantity, unit, reorder level and supplier, and supplier orders by status. The MCP tools
  `inventory_stock_list` (with a below-reorder filter) and `inventory_orders_list` read them.
- **Clients and suppliers.** A new `parties` module keeps who a business invoices and buys from, each with a legal
  name, tax ID, fiscal address, email and the roles client and supplier, apart from the customers who book. It has no
  page of its own: the invoice reads it, and the MCP tools `parties_list`, `parties_get`, `parties_create` (keyed) and
  `parties_update` list, read, add and change it. The owner and the manager write; staff read. An assistant's update
  waits for a person under the default approval policy; a create does not. Each preset seeds fictitious parties, and
  the workshop's parts and the salon's stock name their supplier.
- **A module is a folder.** Each module declares a manifest (capabilities, settings, MCP hints, seeds, references to
  other modules, view kinds, bell feeds, route slots), and `npm run generate:modules` composes the catalogue, the
  settings, the seeds, the MCP manifest and instructions, the Products views and the bell from the folders present. A
  module that reads another one's data answers when that module is absent, a route fills its optional parts through
  named slots (customers fill the bookings route's guest lookup, search and new-contact fields), and
  dependency-cruiser keeps everything else from importing a module. See ADR 0017 and the guide *Building on the
  template*.
- **Settings page** (`/dashboard/settings`, "Business settings" in the account menu, which replaces the Billing item
  that led nowhere): every role reads the business details; the owner edits them in a form dialog.

### Changed

- The invoice (`/dashboard/invoice`) starts from the business settings instead of a fixed company: the issuer, the
  payment details, the default tax, its rates and the payment terms. It bills a client party of the preset (the clients
  and suppliers directory), never a customer of the agenda, and the paper prints the party's legal name, tax ID,
  fiscal address and email, as a full invoice requires; its lines are the first catalog items, in the request's
  language and in their own currency. It stays a printable draft that no capability numbers or stores, and its
  payment block names the account number instead of a routing number.
- **The bell composes feeds.** It shows the pending approvals, for an actor who may review them, and the feed of each
  installed module, so removing the notifications module leaves the bell with approvals. Mark all as read sends each
  feed its own newest row. A feed that cannot answer no longer hides the bell: the others' rows stay and the panel
  names the failure, in the words of the module that failed. Each module words the approval rows of its own writes.
- **MCP changes.**
  - The `idempotencyKey` argument of create and add tools is now a UUID, a new one for each operation and the same one
    to retry it; a host's `_meta["admin-os/idempotencyKey"]` keeps its rule of 1 to 128 characters. Short keys that
    two operations could share no longer validate.
  - `notifications_list` no longer returns approval rows: its `kind` lost `approval.requested`. A held write is
    checked with `approvals_get` and decided from the bell.
  - A held write's structured result carries the "do not retry" hint, and the advertised output schema declares it.
  - The server's instructions tell an agent to take every date from `clock_get`, and list the installed modules in id
    order.
  - The missing-secret error of the web Worker names the repository root's `.dev.vars`.
  - New tools: `parties_*` and `inventory_*` (above); `docs/mcp/reference.md` is regenerated.
- The demo's seed data grew (shop, retail and parts items, stock, supplier orders, parties), so a returning visitor's
  saved demo session resets once.
- The documentation is split by purpose: a short README, guides in `docs/guides` (development, architecture,
  building on the template, deployment, MCP) under an index in `docs/README.md`, a rewritten `CONTRIBUTING.md` and a
  new `SECURITY.md`. `package.json` declares Node.js 24 in `engines`. The README and the architecture guide describe
  the module seam, the parties module, the Products views and the bell, and the guide *Building on the template*
  explains how to remove a module and add it back.

### Fixed

- Every item of the account menu leads somewhere: Account opens `/dashboard/profile`, Business settings the Settings
  page, Notifications the bell's inbox (hidden when the role cannot read notifications) and Log out the sign-in page.
- Approving a held write that can no longer run reports its own rule, such as `bookings.start_passed` for a booking
  whose start has passed, instead of `approvals.conflict`; that code stays for a write that would now change other
  records than when it was asked.
- With the customers module absent, `bookings_search`, `bookings_create` and the notifications reads no longer fail:
  a booking's guest is named by its contact name.
- `npm run deploy` stops unless `NEXT_PUBLIC_SITE_URL` is a public https URL, read from the shell and the `.env`
  files as the build reads it; without it the build wrote localhost into canonical, Open Graph and sitemap links.
- A booking can no longer start before the business clock. `bookings.availability.get` offers only the starts still
  ahead (none on an earlier day), and `bookings.create` and `bookings.reschedule` refuse an earlier start with
  `bookings.start_passed`; before, only the web form hid past times, so an MCP client could book them.
- A list page that does not match its schema (a guest, a product or a stock row with bad data) shows an error state
  with its reason instead of breaking the page.
- The "Move to stage" submenu of a deal's menu on the home screen was clipped by its parent menu and could not be
  pressed; it now opens in its own layer. The dead-click sweep now opens every menu and fails an item that does
  nothing.

### Removed

- The Products page's static e-commerce rows, its add drawer and its product form: there are no catalog writes, so
  they had no destination. The page shows the preset's own views instead.

## [0.2.0] - 2026-11-04

The first release. admin-OS began as an import of the dashboard template credited in the README; this entry covers
everything since that import.

### Added

- **Shell.** The top navigation and the tool rail come from each preset's nav manifest, filtered by permission
  (hidden, never disabled). Demo switches for role, preset, language and reset. The bell shows the actor's
  notifications.
- **Design system.** Five liquid-glass themes in light and dark, with an opaque fallback for reduced transparency.
  Touch targets of at least 44 × 44 px on coarse pointers; glass capsules keep their height and give their segments a
  larger hit area.
- **Languages.** The whole app in English, Spanish, German and French from typed dictionaries, with `Intl` dates,
  numbers, plurals and currency (USD, EUR or GBP, chosen in Preferences). A lint rule rejects visible text written
  outside the dictionaries.
- **Data seam.** Every screen reads and writes through capabilities: typed contracts with permissions, effects, risk
  tiers and idempotency, called through one client and answered by an adapter. The mock adapter runs on a seeded
  business clock.
- **Modules and presets.** Generic modules for bookings, customers, catalog, staff, resources and notifications, and
  three presets that run them with their own vocabulary and seed: hospitality (the reference), salon and workshop.
- **Bookings.** The floor plan, rail, editor and full view on the data seam: the day's bookings with a day stepper,
  status changes, cancel, no-show, seating a walk-in, and a new reservation backed by availability, with undo where
  the action can be reversed.
- **Customers.** A directory with search, a VIP filter, CSV export and cursor pages, and a new-contact window that
  warns about a duplicate phone.
- **Window kit.** `ConfirmAction`, `QuickDialog`, `FormDialog`, `ResponsivePanel` and `PopoverOrSheet`, with
  guarded exits, undo toasts, read states and the awaiting-approval notice; each job has its window (ADR 0015). The
  kit has its own page at `/dashboard/kit`.
- **Approvals.** A policy holds an assistant's writes for a person to decide; held writes are recorded and approved
  or rejected from the bell.
- **MCP server.** Its own Cloudflare Worker over Streamable HTTP, and a stdio server for local clients. A typed
  manifest classifies every capability as a tool or as UI-only. Tools carry honest annotations, idempotency by
  operation, concise list rows and errors that say how to fix the call. OAuth issues `read` and `write` scopes with
  step-up, bound to the visitor's demo session. A generated reference lists every tool (`docs/mcp/reference.md`).
- **Showcase screens.** Mail, chat, projects, tasks, schedule, finance, e-commerce, infrastructure, productivity,
  logistics, patient monitoring and the legacy screens work on demo-local state through the kit's windows.
- **Deploy.** Cloudflare Workers through OpenNext. Each visitor's demo data lives in a Durable Object, reached
  through a signed session cookie. `npm run deploy` checks the shared secret on the web and MCP Workers before it
  deploys the store, the MCP Worker and the app in that order.
- **Landing page** in four languages, with README and landing images captured from the running app
  (`npm run media`).
- **Quality.** Layer boundaries checked by dependency-cruiser. A Playwright smoke at 375 and 1440 px that fails on any
  control that does nothing, run in parallel shards on CI for every push to `main` and every pull request. A
  cross-door e2e on `wrangler dev` (`npm run test:e2e:workers`), a consistency probe for the durable demo
  (`npm run probe:consistency`) and agent evals that run golden MCP tasks through Claude Code (`npm run eval:mcp`).

### Changed

- `/dashboard/users` is now `/dashboard/customers`, with a permanent redirect.
- The MCP endpoint moved from the web app's `/api/mcp` to the MCP Worker (`/mcp`); `/api/mcp` answers 410 with the
  new URL.

### Removed

- Google Analytics from the root layout.
- Controls of the inherited screens that had no destination; each one now works or is gone.

### Security

- Generic cookie reads and writes are no longer exposed as Server Actions.
- The demo's toasts never echo submitted values.
- The public demo MCP tokens are read-only.
- The demo cookies are `Secure` over HTTPS, bounded in time and scoped to the request's host.

[Unreleased]: https://github.com/lroy-stack/admin-os/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/lroy-stack/admin-os/releases/tag/v0.2.0
