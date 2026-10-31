# ADR 0008 — Testing: Vitest for pure logic and contracts, plus a Playwright smoke matrix over roles, viewports and presets

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` (acceptance) · Related: ADR 0003–0007

## Context

**What exists:**

- Vitest 5 runs through `npm test` (`vitest run`, no config file).
- Tests sit next to pure modules: `bookings/_components/floor/*.test.ts` and `rail/rail-plan.test.ts`.
- ADR 0001 added Vitest for the pure floor-plan logic.
- AGENTS.md still says "There is currently no automated test command", which is stale.

**What is missing.** There are no browser tests, and `@playwright/test` is not installed.

**What every slice must show** (spec acceptance):

- permissions hide entries and actions for Propietario, Encargado and Personal;
- designed states are reachable: loading, empty, error by code, awaiting approval;
- 375 / 834 / 1440 px with no console errors;
- seams and dictionaries are respected.

**the reference console's practice.** A smoke e2e at 375 and 1280 px pins what the user does *before* migrating a screen, and the
tests of deleted pieces go with them (the reference console `CLAUDE.md`, Working style 3).

**The salon preset (ADR 0004)** needs an automated check that nothing generic is restaurant-coupled.

## Options considered

1. **Vitest only, plus manual `ui-qa` passes.**
   - *Pros:* cheap.
   - *Cons:* role hiding, hydration errors, preset swaps and the responsive shell can regress silently between
     slices.
   - *Effort:* S.
2. **Vitest contract tests plus a Playwright smoke matrix (chosen).**
   - *Effort:* M once, then S per slice.
3. **Visual regression** (Playwright screenshots or a hosted service).
   - *Pros:* catches pixel drift.
   - *Cons:* flaky with the WebGL room, the glass blur and the fonts; high maintenance. `ui-qa` already reviews
     visuals per slice.
   - *Effort:* M, with ongoing cost.

## Decision

Option 2.

### Vitest (`npm test`): pure logic and contracts, no browser

**Pure modules** keep their co-located `*.test.ts`. Planners, state readers, mappers, `can()`, `resolveLocale()`,
`errorText()`, pagination and the mock dispatcher pipeline all qualify.

**Contract tests** live in `src/config/contracts.test.ts` and run for every preset:

| Contract | What it checks |
| --- | --- |
| Seed | Every seed parses with its module's zod schemas |
| Registries | Ids are unique; every registry entry references an enabled module; every nav, layer, section and notification permission exists in the capability catalogue |
| Roles | owner ⊇ manager ⊇ staff, and each role is a subset of the catalogue |
| Dictionaries (ADR 0007) | All four locales present, no empty strings, identical placeholders, `Plural` has `one` and `other`; preset vocabulary keys exist in module messages and keep their placeholders |
| Mock adapter | Each capability's mock output parses with its output schema for every role; forbidden roles get `access.forbidden` |

**The leak check** (`src/config/leaks.test.ts`) reads the source of `src/core`, `src/ds`, `src/engines` and
`src/modules`. It fails on each preset's `leakTerms`, matched as whole words in identifiers and string literals:

| Preset | Terms |
| --- | --- |
| hospitality | `diner`, `dining`, `covers`, `waiter`, `allergen`, `dish`, `restaurant`, `mesa`, `comensal`, `carta` |
| salon | `stylist`, `haircut` |
| workshop | `vehicle`, `mechanic` |

The lists live in each preset. `table` is deliberately absent because it collides with HTML and data tables.

### Playwright (`npm run test:e2e`): smoke, not features

**Setup:**

- A new dev dependency, `@playwright/test`. The reason: browser behaviour (server-filtered nav, hydration,
  responsive shell) is the acceptance criterion, and nothing in the repo can observe it.
- Chromium only. Browsers are cached in CI.
- It runs against `next build && next start` with `DATA_ADAPTER=mock` and the fixed preset clock. One build serves
  both presets through the demo cookie (ADR 0004).

**The matrix.** One spec per route under `e2e/smoke/`:

| Axis | Values | Applies to |
| --- | --- | --- |
| Viewport | 375, 1440 | every route (834 stays a manual `ui-qa` check) |
| Preset | hospitality, salon | every route in that preset's nav |
| Role | owner, manager, staff | the shell (areas, tools) and **one gated action per slice** |
| Locale | en, es, de, fr | the shell and one route |

**What each smoke asserts:**

- the page heading is visible;
- no `console.error` or hydration warning;
- no uncaught request failure;
- hidden entries and actions are **absent** from the DOM for that role;
- under salon, none of the hospitality vocabulary strings (`Comensales`, `Covers`, `Mesa`, …) appear;
- under every locale, no other locale's shell strings appear.

**Reaching states.** Designed states are opened with `MOCK_FAULTS` per test (ADR 0005): one `not_found`, one
`forbidden` and one `awaiting_approval` per slice.

**Out of scope:**

- WebGL pixels: the room canvas is `aria-hidden`. The labelled table buttons are asserted instead (ADR 0001).
- Visual snapshots.

**Budget and placement:**

- under 3 minutes in CI;
- part of the Stop-hook gates once F5 lands: Biome, tsc, vitest and build stay as they are, and e2e is added.

**Timing.** A slice adds its smoke spec **before** redesigning its page (the reference console's rule). The spec first pins the
current behaviour; the slice then updates it in the same change that changes the requirement.

## Consequences

- **New dev dependency and two new scripts:**
  - `@playwright/test`, with about 150 MB of browser download (cached in CI);
  - `test:e2e`, plus `test:e2e:ui` for local debugging.
- **AGENTS.md § Setup** should list `npm test` and `npm run test:e2e` on acceptance; the owner edits it.
- **The salon preset is a real contract.** Any restaurant term in a generic layer fails CI twice: statically, and
  in the rendered salon pages.
- **Reversal is cheap.** Specs are independent files.
- **Revisit when:**
  - **WebKit becomes a target**, for example a Safari tablet as a wall screen: add a WebKit project;
  - **visual drift slips past `ui-qa`** twice in a row: add screenshot checks for the shell only.
