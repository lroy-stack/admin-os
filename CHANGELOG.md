# Changelog

All notable changes to admin-OS are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `npm run deploy` stops unless `NEXT_PUBLIC_SITE_URL` is a public https URL, read from the shell and the `.env`
  files as the build reads it; without it the build wrote localhost into canonical, Open Graph and sitemap links.

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
