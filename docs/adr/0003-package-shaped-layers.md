# ADR 0003 — Package-shaped layers, one dependency direction, and the porting map

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` · Related: ADR 0004–0008

## Context

This repo is a fork of Studio Admin that becomes a **reusable, publishable kit** for building the management
dashboard of any small business (restaurant, hair salon, car repair workshop). reference's restaurant console is the
reference consumer. Later, a clean monorepo and reference's new console app will be built by **porting folders out of
this repo**. The owner's constraint is that the repo stays a generic template.

What the code shows today:

- **Shared code lives inside the route tree.** Everything shared sits in `src/app/(main)/dashboard/_components/`:
  the shell, the glass controls and the tones. A future package cannot import from `src/app/**`.
- **The shell is coupled to demo data and to a static nav:**
  - `shell/top-nav.tsx:14` imports the demo users from `@/data/users`;
  - `top-nav.tsx:15` and `shell/app-rail.tsx:8` import the static nav from `src/navigation/shell/shell-items.ts`;
  - that file hard-codes the restaurant route `reservas` in `TOP_NAV_IDS`;
  - `header/search-dialog.tsx:21-22` reads `sidebar-items.ts` directly.
- **Shared components are bound to the CRM demo dataset.** `_components/deal-card.tsx:5-6` and
  `member-avatars.tsx:4-5` import `@/data/crm` and `@/lib/crm`.
- **Pure logic is bound to mock data.** `reservas/_components/floor/table-state.ts:2` and
  `reservation-status.ts:2` import `SERVICE_NOW_MIN` and `LATE_AFTER_MIN` from the mock file
  `reservations-data.ts`. That ties them to a mock clock and to a hard-coded business rule.
- **The design system is mixed into the app stylesheet.** `src/app/globals.css` (565 lines) holds:
  - the tokens: `@theme inline` at l.13, `:root` at l.62, `.dark` at l.153;
  - the glass utilities: `@utility glass-surface` and `liquid-glass*` at l.188–243, `liquid-thumb`;
  - motion: the view-transition keyframes from l.342.

  The presets live in `src/styles/presets/`. The theme runtime is spread over `src/lib/preferences/`,
  `src/stores/preferences/`, `src/scripts/theme-boot.tsx` and `src/server/server-actions.ts`.
- **AGENTS.md rules:**
  - keep code in its route until another feature reuses it;
  - never modify `src/components/ui/` or `src/components/calendar/`.
- **reference enforces its layers.** Core → Engines → Domains → Interfaces is enforced by `depcruise`, and
  `a shared package` may not import business logic (reference `CLAUDE.md`).
- **Tooling.** Biome 2.6.4 is the only linter (`biome.json`). It already enables `noImportCycles` and
  `noUndeclaredDependencies`. Boundaries moved to `dependency-cruiser` (see Enforcement).

## Options considered

1. **Co-location only (status quo).** Every shared piece goes under `dashboard/_components/`.
   - *Pros:* no cost.
   - *Cons:* nothing can be extracted (the paths are `src/app`), presets cannot be swapped, and nothing is
     enforced. The port becomes a rewrite of imports plus untangling.
   - *Effort / reversal:* S / trivial.
2. **npm-workspaces monorepo now** (`packages/*`, `apps/template`).
   - *Pros:* real package boundaries.
   - *Cons:* it freezes every engine's API before its second consumer exists, which is speculative. It also brings
     tooling churn: Next `transpilePackages`, Tailwind `@source`, the shadcn `components.json` aliases, per-package
     Biome, and Cloudflare builds. Every slice gets slower.
   - *Effort / reversal:* L / M.
3. **Package-shaped folders in one app (chosen).**
   - *How:* top-level layers under `src/`. Each folder is shaped like a future package: public entries, no upward
     imports, enforced by `dependency-cruiser`. Extraction later means moving the folder, adding a `package.json` and
     changing an alias.
   - *Effort / reversal:* M / S.

## Decision

Option 3.

### Layers and direction

A lower layer never imports a higher one:

`L0 platform` ← `L1 core` ← `L2 ds` ← `L3 engines` ← `L4 modules` ← `L5 verticals` ← `L6 config` ← `L7 app`

| Layer | Folder | Holds | Future package |
| --- | --- | --- | --- |
| L0 platform | `src/components/ui`, `src/components/calendar`, `src/lib`, `src/hooks` | shadcn primitives (untouched), `cn`, `use-mobile`, generic utils | `packages/ui` (primitives) |
| L1 core | `src/core` | Pure contracts and tiny React contexts: `Result`, errors, pagination, capability, client and adapter interfaces, the generic mock dispatcher, access (`can`), i18n (locales, messages, `Intl` formatters, error text), business clock, registry types (nav, channels) | `packages/core` |
| L2 ds | `src/ds` | Tokens and glass CSS, presets, domain-free components, props-driven shell, preferences runtime, data-table features | `packages/ui` |
| L3 engines | `src/engines/<engine>` | Domain-agnostic mechanisms with a data contract: `agenda` (FullCalendar + layers + ResourceTimeline as an owned custom view), `feed`, `board`, `inbox`, `record-panel`, `settings-form`, `space-scene` | `packages/engines/*` |
| L4 modules | `src/modules/<domain>` | Generic domains: schemas, capability descriptors, permissions, mock handlers, messages, domain UI (`bookings`, `customers`, `resources`, `staff`, `catalog`, `vouchers`, `tasks`, `conversations`, `notifications`, `settings`) | `packages/modules/*` |
| L5 verticals | `src/verticals/<preset>` | Presets: vocabulary, nav, roles, enabled modules, registrations, seed data, vertical-only extensions (ADR 0004) | `presets/*` |
| L6 config | `src/config` | Composition root: app config, preset selection, merged capability catalog, adapter wiring, `getRuntime()` | `apps/template/src/config` |
| L7 app | `src/app` | Thin routes: `page.tsx` reads, `actions.ts` writes, route-local `_components/` | `apps/template` |

**Target tree.** Folders appear when their first content moves in:

```text
src/
├─ components/ui/, components/calendar/   L0 shadcn primitives (untouched; shadcn CLI target)
├─ lib/, hooks/                           L0 utilities
├─ core/                                  L1 → packages/core
│  ├─ result/ errors/ pagination/ capability/ client/   seam contract (ADR 0005)
│  ├─ mock/                               generic mock dispatcher (server entry)
│  ├─ access/ nav/ channels/              can(), roles, nav manifest type (ADR 0006)
│  └─ i18n/ clock/                        locales, messages, Intl formatters, errorText (ADR 0007)
├─ ds/                                    L2 → packages/ui
│  ├─ styles/ tokens.css glass.css motion.css presets/
│  ├─ components/                         page-header, segmented-control, liquid-thumb, tone-pill, …
│  ├─ shell/                              top-nav, app-rail, account-menu, search-dialog (props-driven)
│  └─ preferences/                        store, provider, boot script, preference actions
├─ engines/                               L3 → packages/engines/* (each on its 2nd consumer)
│  └─ feed/ (S1) agenda/ (S3) inbox/ (S5) board/ (S7) settings-form/ (S10) space-scene/ (S10)
├─ modules/                               L4 → packages/modules/*
│  └─ <domain>/ index.ts  server.ts (+ mock/, messages)  ui.ts (+ ui/)
│     bookings/ notifications/ staff/ vouchers/ (S1) customers/ (S2) resources/ (S3) …
├─ verticals/                             L5 → presets/*
│  ├─ hospitality/ index.ts  server.ts (vocabulary, seed)  ui.ts (floor extension, S3b)
│  └─ salon/       index.ts  server.ts                    (proof preset, ADR 0004)
├─ config/                                L6 composition root: app-config, vertical, catalog, data.server, runtime
└─ app/                                   L7 → apps/template
   ├─ (main)/dashboard/<route>/ page.tsx  actions.ts  _components/
   ├─ (main)/dashboard/(examples)/        showcase-only screens + (legacy)
   └─ (main)/mail/, (main)/chat/, (external)/
```

**Same-layer rules:**

- Engines do not import each other.
- A module may import another module's **contract entry** only, and the graph stays acyclic. Cross-module UI is
  composed in the route through slots.
- Verticals never import each other.
- Routes never import a vertical directly (only `@/config`), so swapping a preset never touches a route.

### Public entries (future `package.json` `exports`)

Every folder in L1–L5 is reached only through:

| Entry | Contents | Rule |
| --- | --- | --- |
| `index.ts` | Isomorphic contract: types, zod schemas, capability descriptors, pure functions | Safe to import from client and server |
| `server.ts` | Mock handlers, messages (all four locales), preset seeds | Starts with `import "server-only"`, so Next fails the build if a client file reaches it |
| `ui.ts` | Client components (`"use client"` at the leaf files) | Exists only once a UI piece has a second consumer |

`src/ds` and `src/core` expose first-level subpaths (`@/ds/shell`, `@/ds/components`, `@/core/result`,
`@/core/i18n`, …).

### Extraction rule

This keeps AGENTS.md's intent. Code starts in its route's `_components/` and **moves when a second consumer
appears**: another route, another engine or module, or another preset (the salon proof counts, ADR 0004).

| What the code is | Where it moves |
| --- | --- |
| Presentational and domain-free | `src/ds` |
| A mechanism with a data contract | `src/engines/<name>` |
| A domain's contract, seam or UI | `src/modules/<domain>` |
| Vocabulary, data or a vertical-only extension | `src/verticals/<preset>` |

- **A move is only a move.** API changes go in a separate change.
- **One exception:** a domain's **data seam** (schemas, capability descriptors, mock handlers) is created in
  `src/modules/<domain>` from its first slice.
  - The seam is cross-area by nature: Inicio reads bookings, staff and vouchers in S1.
  - The port swaps it in one place (ADR 0005).

### Design system kept separable (`src/ds`)

**CSS.** `globals.css` splits into four parts; `src/app/globals.css` keeps only the entry imports (`tailwindcss`,
`tw-animate-css`, `shadcn/tailwind.css`, the ds files, and `@source` once ds is a package):

| New file | Content |
| --- | --- |
| `src/ds/styles/tokens.css` | `@theme`, `:root`, `.dark` |
| `src/ds/styles/glass.css` | `glass-surface`, `liquid-glass*`, `liquid-thumb` |
| `src/ds/styles/motion.css` | View-transition keyframes, reduced motion |
| `src/ds/styles/presets/*.css` | Moved from `src/styles/presets/`; the path in `generate:presets` (`src/scripts/generate-theme-presets.ts`) is updated |

**Components moved as-is.** Each one already has two or more consumers:

- `page-header`, `segmented-control`, `liquid-thumb`, `tone-pill`, `tones`, `stat-tiles`;
- `filter-chip`, `search-capsule`, `period-stepper`, `card-icon-button`, `currency-tooltip`;
- `src/lib/data-table-features.ts`;
- the preferences runtime: `lib/preferences`, `stores/preferences`, `scripts/theme-boot.tsx`, and the preference
  actions from `server/server-actions.ts`.

**The shell becomes props-driven.** `TopNav`, `AppRail`, `AccountMenu` and `SearchDialog` receive items, brand and
actor as props. They import nothing from `@/navigation`, `@/data` or `@/config`; ADR 0006 defines what feeds them.

**Not ds.** `deal-card.tsx` and `member-avatars.tsx` are bound to `@/data/crm`. They stay with the template demo
until `default` and `crm` are redesigned.

### Template demo kept apart

- **Showcase-only screens** move into the route group `src/app/(main)/dashboard/(examples)/`: `logistics`,
  `patient-monitoring`, `productivity`, `tasks`, `coming-soon` and `(legacy)`. URLs are unchanged.
- **Their data stays with them:** `src/data/*` and `src/lib/crm.ts`, while only demo or not-yet-redesigned pages
  use them.
- **Pages that ia.md §2 maps to a new role are redesigned in place.**

### Enforcement

Boundaries are enforced by `dependency-cruiser` (`.dependency-cruiser.cjs`, `npm run depcruise`, part of
`npm run check` and of the pre-commit hook). Biome keeps the rest: `noImportCycles`, `noUndeclaredDependencies`
and `noJsxLiterals`.

> **Update 2026-10-31.** The first version of this ADR enforced boundaries with Biome `noRestrictedImports`
> overrides. Biome has no way to say "relative path that leaves this package", so each folder depth needed its own
> block and the config grew to 36 override blocks, past the trigger below. The boundary rules moved to
> `dependency-cruiser`: one generic rule set over layer and package paths, which also resolves the `@/` alias and
> checks type-only imports.

The rules:

- **Layer direction.** A layer never imports a higher one, and `src/lib`, `src/hooks`, `src/components/ui` and
  `src/components/calendar` import no layer. One rule per layer, generated from the layer list.
- **Public entries only.** Outside a package, `src/{core,ds,engines,modules,verticals}/<package>/` is reached only
  through `index`, `server` or `ui`, whether the import is written with `@/` or relatively. The one exception is
  `@/ds/preferences/actions`.
- **No relative escape.** A relative import cannot leave its engine, module or preset, nor the `core` or `ds` layer;
  crossing a package needs the alias.
- **Same-layer isolation.** One engine does not import another engine, and one preset does not import another preset.
- **`ds` is domain-free.** It never imports `src/data` or `src/navigation`.
- **Also on:** `import "server-only"` in every `server.ts`.

New packages are covered without editing the config.

### Porting map

| This repo | Published kit (future monorepo) | reference's new console |
| --- | --- | --- |
| `src/components/ui`, `src/components/calendar`, `src/lib`, `src/hooks` | `packages/ui` (primitives) | consumed |
| `src/ds` | `packages/ui` (`/shell`, `/glass`, `/preferences`, tokens CSS) | consumed |
| `src/core` | `packages/core` | consumed; `Result` is shape-identical to `a shared package` |
| `src/engines/*` | `packages/engines` (one subpath per engine) | consumed |
| `src/modules/*` (`index`, `ui`) | `packages/modules` (`/customers`, `/customers/ui`, …) | consumed |
| `src/core` mock dispatcher + `src/modules/*/server` mock handlers | `packages/adapter-mock` | dev and demo only |
| — (never in this repo) | — | `apps/console/src/lib/adapter-reference.ts`: maps ids and outputs onto `a shared package` (ADR 0005) |
| `src/verticals/hospitality` | `presets/hospitality` | vocabulary, registrations, floor extension (not the seed) |
| `src/verticals/salon` | `presets/salon` | — |
| `src/config` and the redesigned routes in `src/app/(main)/dashboard/*`, `mail`, `chat` | `apps/template` (what a scaffold copies) | routes copied into `apps/console/src/app/(app)/` under reference's slugs |
| `(examples)`, `(legacy)`, `src/data`, `src/lib/crm.ts`, `(external)` landing, `auth/v1`, `auth/v2` | stays here as the template demo (`apps/showcase`) | not ported |

**Distribution (sketch, not a commitment):**

- **(a) The kit.** A monorepo with npm workspaces: `packages/{ui,core,engines,modules,adapter-mock}`,
  `presets/{hospitality,salon,…}` and `apps/{template,showcase}`, versioned with changesets.
- **(b) A scaffold.** `npm create studio-admin -- --preset salon` copies `apps/template`, installs the packages,
  writes `src/config/vertical.ts` with one preset and deletes the others.
- **(c) An optional shadcn registry** for `ds` and the engines, because shadcn users expect to own component
  source. `core` and `modules` stay npm packages because they are versioned contracts.

Decide between them when there are two external users.

## Consequences

- **F0 is a pure move.** ds leaves `src/app`, the shell becomes props-driven, the boundary rules land and the
  `(examples)` group is created. Behaviour does not change. Verify with `npm run build`, `npm test`, `npm run check`,
  and screenshots of Overview, Reservas and Calendar.
- **AGENTS.md** (§ Co-location-based structure) needs the new top-level folders and the extraction table on
  acceptance; the owner edits it.
- **The import rule:** imports that cross a layer use `@/`; relative imports stay inside one package.
- **Reversal is cheap.** The rules are configuration and the folders can be collapsed.
- **Revisit when:**
  - **two external consumers exist.** Then start the monorepo (option 2).
