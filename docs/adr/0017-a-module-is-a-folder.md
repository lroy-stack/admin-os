# ADR 0017 — A module is a folder: a manifest per module, and a generated composition root

Status: accepted (owner, 2026-11-05) · Date: 2026-11-05 · Spec: `docs/specs/006-v1/spec.md` (D1–D5, D12, D13, AC2–AC4) · Evidence:
census C0 at d1f0dcc (below), spike S1 (485b904) · Amends: ADR 0003, 0004, 0006, 0009, 0016 · Related: ADR 0005,
0018, 0019

## Context

### Why

v2 is built by merging v1 tags, and coding agents add and remove modules. Both should work without editing v1's
composition files by hand. That is the deciding reason (spec 006 D1). A plugin market is not.

### What a module costs today

Census C0, taken at d1f0dcc, replaces spike S0, which ran 31 commits before v0.2.0.

- **Method.**
  - Each module was removed from a clean copy, then `tsc` was run on the app and on the Workers. The Workers'
    baseline errors in the copy (no `wrangler types` output) were subtracted.
  - dependency-cruiser listed every import into a module from `src`, `workers`, `e2e` and `scripts`.
  - Each module's capability ids and tool names were searched in files that do not import it.
- **Removing a module breaks these files outside it** (`tsc`, first order: a missing import hides the errors
  behind it):

  | Removed | Total | Composition | Config tests | Preset seeds and tests | Other modules | Own route | Other routes | App, no owner |
  | --- | --- | --- | --- | --- | --- | --- | --- | --- |
  | `catalog` | 13 | 3 | 3 | 4 | 0 | 0 | invoice 3 | 0 |
  | `bookings` | 29 | 5 | 6 | 6 | 3 | 9 | 0 | 0 |
  | `notifications` | 12 | 4 | 4 | 0 | 0 | 0 | 0 | 4 |
  | `customers` | 24 | 4 | 5 | 3 | 0 | 5 | bookings 7 | 0 |
  | `resources` | 11 | 3 | 3 | 3 | 1 | 0 | bookings 1 | 0 |
  | `staff` | 11 | 4 | 3 | 3 | 1 | 0 | 0 | 0 |

- **Edges between modules:**
  - `notifications → bookings` at runtime (`mock.ts`, `derive.ts`, its test);
  - `bookings → resources` as a type only (`mock.ts`);
  - `bookings → staff` from a test only (`schema.test.ts`).
- **Data read across modules without a guard.** `bookings/mock.ts` reads the customers collection, and
  `notifications/derive.ts` reads the customers and bookings collections. A missing collection throws.
- **App files that import a module and belong to no module:**
  - the dashboard layout's bell and its two helpers import `notifications`;
  - the invoice imports `catalog`.
- **The bookings route's tie to `customers` is more than UI.** Its loader, its actions, the guest search and the
  new-reservation form call `customers.*`.
- **Coupling by name only, which `tsc` cannot see:**
  - `bookings` tools are named in 28 files and `customers` tools in 23, including the Workers' MCP tests, the eval
    scripts, `probe-consistency.ts` and the cross-door e2e;
  - `src/config/mcp-instructions.ts` (`ID_SOURCES`) and the hints in `mcp-manifest.ts` are typed capability-id lists.
    They fail `tsc` once the removed module's ids leave `CapabilityId`, behind the first-order errors.

### What the spike showed

Spike S1 (485b904) gave six modules a manifest and generated the composition maps.

- **Composition.** Removing `catalog` and regenerating edited nothing in `src/core` or in the non-generated files of
  `src/config`.
- **Types.** `CapabilityId` stayed a literal union, and a planted unclassified capability failed `tsc`.
- **Cost.** Median of five `tsc` runs: types +1.15 % (limit 10 %), check time +1.7 % (limit 20 %).
- **Reference.** `docs/mcp/reference.md` stayed byte-identical. Removing `catalog` still left
  `src/config/mcp.server.test.ts` to edit.
- **What it did not measure.**
  - It did not derive `requires`: its refusal came from required references only.
  - It did not cover the routes, the shell or the tests by name that C0 found.

The owner approved the direction (O1): manifests, a generator, a registry for `ds` pieces only, no monorepo.

## Decision

### 1. A manifest per module

`src/core/module` defines `defineModule`. Each module exports `<module>Module` from `index.ts`, and `<module>ModuleServer`
(its messages and mock handlers) from `server.ts`.

| Field | Holds |
| --- | --- |
| `id` | The folder name, and the first segment of every capability id |
| `capabilities` | The module's capability record |
| `settings` | The settings it declares (ADR 0006) |
| `mcp` | `noun`; `tools`, one entry per capability, as `MCP_MANIFEST` requires today; `idSources`, the list tools that give each kind of id it owns (today's `ID_SOURCES` lines) |
| `seed` | Its seed collections: row schema, whether a preset that enables it must seed rows, and the `ext` entity a preset may type |
| `references` | Data fields that hold another module's ids: field, target module, `required` or optional |
| `views` | The view kinds it declares (ADR 0018), as serialisable descriptors |
| `feeds` | What it contributes to the shell's bell (ADR 0006's notification types), as serialisable descriptors |
| `slots` | The named route slots it fills (§4), as descriptors |
| `owns` | Paths outside the folder that go with it: its routes, config tests, Worker and e2e tests, eval tasks, scripts |

- **What it replaces.** The manifest replaces `extends` and the required-collections list. It also supersedes spec
  006 AC2's `extends` field and D4's placement of MCP hints under `references`: hints live in `mcp.tools`, as today.
- **Completeness.** An entry in `mcp.tools` for no capability does not compile, and neither does a capability without
  one. `MCP_MANIFEST` already rejects both directions today.
- **Code stays out of the manifest.** It holds data and descriptors only, because the Workers import it through the
  composition root and must never reach web code (`workers-reach-no-web-code`, ADR 0016). A module's components (view
  renderers, bell feeds, slot fills) are exported from its `ui.ts`. Their server halves (loaders, the capabilities a
  feed's actions call) come from its `server.ts`.

### 2. Every edge counts, and incidental ones are removed

- **`requires` is derived, never written.** The generator reads, through dependency-cruiser's API, every import of a
  module's folder and its owned paths:
  - runtime, type-only and test edges alike, because `tsc` fails on all of them;
  - with the include list widened to `e2e/` and `scripts/` for owned paths there.
- **An edge that serves only to type data the module reads is removed.** The reader declares the fields it uses as a
  local type (task M2b):
  - `bookings → staff` (a test fixture) goes away;
  - so does `bookings`'s type import of `resources` in `mock.ts`;
  - the bookings route still lists resources for the floor plan (`load-bookings.server.ts`), so **`bookings`
    requires `resources`**. That is a real dependency: a room needs its tables.
- **`notifications → bookings` is a real dependency.** Removing `bookings` alone is refused; remove `notifications`
  with it (spec 006 AC4, W2).
- **Where the graph is written.** It goes into `modules.generated.ts` (`MODULE_GRAPH`, the plan's name), and into the
  module reference once that page exists (006 A3).

### 3. References are data, with a runtime contract

| Module | Field | Target | Kind |
| --- | --- | --- | --- |
| `bookings` | `lines[].catalogItemId` | `catalog` | optional |
| `bookings` | `customerId` | `customers` | optional |
| `bookings` | `staffIds[]` | `staff` | optional |
| `bookings` | `resourceIds[]` | `resources` | required (`bookings` requires `resources` through its route) |
| `notifications` | `customerId` (in a derived item) | `customers` | optional |
| `inventory` (ADR 0018) | `stockItems[].catalogItemId` | `catalog` | optional |
| `inventory` (ADR 0018, 0019) | `stockItems[].supplierId`, `purchaseOrders[].supplierId` | `parties` | optional |

**The runtime contract of an optional reference:**

- A handler reads another module's collection only through `collectionOf(data, "<name>")`. It returns an empty list
  when that module is not installed.
- An id that matches nothing is "unknown", never a throw: a booking names a guest by its own `contactName`.
- The composition passes only the collections of installed modules.
- The adapter contract runs each module's handlers with every optional target absent (M4c), and they answer without
  throwing.

A required reference makes the generator refuse when its target is absent.

### 4. Every app file that imports a module has an owner

| File | Owner, and why |
| --- | --- |
| The bookings route | `bookings`, which therefore requires `resources` and, until M9, `customers`. |
| The customers route | `customers`. |
| The invoice | `catalog` until `parties` exists (ADR 0019); then `parties`. Its catalog types become local (M2b) and it reads `catalog.list` by id, so the starting lines are optional. |
| The bell (`layout.tsx`, `notification-actions.ts`, `notification-view.ts`) | The shell. The layout imports no module. The bell shows the kernel's approvals plus the `feeds` the generated lists give it (ADR 0006's notification types). `notifications` owns its feed; removing it leaves the bell with approvals only (task M10). |
| The Products route (ADR 0018) | `catalog`. It renders view kinds through a generated client map, so it imports no other module's views. |

**Slots (M9).** A route declares named slots with a local props type. A module fills one through its manifest's
`slots` descriptor, with the component from its `ui.ts` and the loader from its `server.ts`. The generated maps give
the route what is filled, and an unfilled slot renders and loads nothing.

M9 moves the guest picker, the guest search, the contact fields and the guest loading into `customers`, filling the
bookings route's slots. The files it changes are:

- `page.tsx`, `actions.ts`, `load-bookings.server.ts` and `view-model.ts`;
- `new-reservation-dialog.tsx` and `new-reservation-form.ts`;
- `guest-picker.tsx` and `guest-search.ts`;
- their tests.

**Verify:** removing `customers` and regenerating keeps `bookings` building.

**The bell (M10).**

- **Approvals move to the kernel.** The approval items move out of `notifications/derive.ts`.
- **One Server Action.** The bell's Server Actions become one shell action that calls a feed's capability by id, from
  the feed's descriptor.
- **The feed's server half** comes from the generated server map.

**The boundary, enforced by dependency-cruiser** (M5, whose message cites this record). Outside `src/modules`, only
these import `@/modules/*`:

- `src/config/*.generated.ts`;
- `src/verticals/*`;
- the paths some module `owns`.

The generator writes the allow-list of owned paths to a file `.dependency-cruiser.cjs` reads, since the config itself
is static.

### 5. A generator writes the composition root

- **Command and outputs.** `npm run generate:modules` writes:
  - `src/config/modules.generated.ts`: manifests, `MODULE_GRAPH`, `InstalledModuleId` (the union of installed ids;
    `src/core/nav`'s `ModuleId` stays `string`, as core cannot import config), `ExtensionEntity`, the view kinds' ids;
  - `src/config/modules.server.generated.ts`: server halves, including feed and slot loaders;
  - `src/config/modules.client.generated.ts`: each module's `ui.ts` (view renderers, bell feeds, slot fills). It is
    the only importer of `ui.ts`.
- **Form of the output.**
  - Static imports in static typed arrays, formatted by Biome. There is no runtime registration and no glob import
    (ADR 0006 chose option 3).
  - **Kernel first.** The kernel's entries stay in a hand-kept list in `src/config`, in today's order, then the
    modules by id (D13).
- **What reads the generated lists:**
  - the catalogues: `SOURCE_CATALOGS`, `SETTINGS`, the module messages and `MOCK_HANDLERS`;
  - the MCP: the module entries of `MCP_MANIFEST`, `ID_SOURCES` (from `mcp.idSources`) and the instructions' module
    sentence. That sentence changes order, which `mcp.server.test.ts` pins, so spec 006 AC2's "order only" diff
    applies there;
  - the seeds: the seed schemas, the required collections of each preset's enabled modules, and `ExtensionEntity`;
  - the view kinds and the bell's feeds.
- **Staleness.** A staleness test fails while any generated file is stale and prints the command. The generator is
  not in the pre-commit hook.
- **The generator refuses, exiting 1 and naming the module and the fix, when:**
  - a module requires an absent one ("notifications requires bookings; restore `src/modules/bookings` or remove
    notifications");
  - a required reference has no target;
  - a folder has no manifest;
  - an `id` differs from its folder;
  - an owned path is missing.

### 6. Installed and enabled stay apart

- **Installed.** A module is installed when its folder exists and the generator lists it.
- **Enabled.** It is enabled when a preset lists it (ADR 0004). A disabled module grants nothing, and the adapter
  refuses its calls.
- **A preset that lists a removed module fails `tsc`.** Presets' `modules` are checked against
  `InstalledModuleId` in `src/config/vertical.ts` (`satisfies`), and the error there names the edit to make.
- **Removing a module** deletes its folder and owned paths. Every remaining edit lies in `src/verticals/*`, named by
  `tsc` or a contract test (spec 006 AC4).

### 7. Tests by name follow their tools, one owner per path

- **A path has one owner,** and M2's contract test checks it. A file that calls two modules' tools is split per
  module: today `workers/mcp/test/mcp.test.ts`, `scopes.test.ts` and `workers/demo-store/test/demo-store.test.ts` call
  both `bookings` and `customers`.
- **The kernel keeps its own cases.** Transport, OAuth and scope cases move onto kernel reads (`access.me.get`,
  `clock.get`) and stay with the kernel (M4d). Each module owns its split files, its config tests (as C0 lists them)
  and, for `bookings`, the cross-door e2e.
- **Scripts stay with the kernel and degrade.**
  - `eval-mcp.ts` loads the golden tasks of installed modules: the tasks split into files each module owns.
  - `probe-consistency.ts` writes through a kernel capability (`settings.values.update`) instead of a module's.
  - Both run from `package.json` and from verify steps, so they must not depend on a removable module.

### 8. The demo store's version

- **What it is.** The saved session's version is the text `` `${STORE_FORMAT}:${seedFingerprint}` ``, compared as
  text, as `catalogVersion` is. `CREATE TABLE IF NOT EXISTS` keeps the existing `INTEGER` column, but a value with a
  `:` never reads as a number, so it is stored as text. A mismatch deletes the row, as today.
- **The format constant.** `STORE_FORMAT` is bumped by hand when the snapshot's own format changes (approvals,
  replays, policy).
- **The fingerprint.** It covers the seeds' shape and their row ids, so added rows reset saved sessions too.
- **Deploying the change** resets every saved session once.
- **The pinned test is replaced.** The pin of `[SCHEMA_VERSION, hash]` gives way to two tests: one that the version
  is composed this way, and one that the fingerprint moves when a collection gains a row.

### 9. Generated files and merges

The generated files are committed. A merge that conflicts in one is resolved by regenerating, never by hand:
the staleness test rejects a hand merge, and `.gitattributes` marks the files `linguist-generated` so reviews hide
their diffs.

## Consequences

- **Adding a module** means its folder, its manifest, `npm run generate:modules`, and the preset lines that enable
  it.
- **Removing one** means deleting its folder and owned paths, then the preset edits `tsc` names. The generator
  refuses when another module requires it.
- **v2's Pro modules** are folders the generator picks up. Merging v1 tags conflicts only in the generated files, and
  regenerating resolves it.
- **The cost:**
  - three generated files and a generator with its staleness test;
  - the manifest type in `src/core`;
  - `collectionOf` and its contract run;
  - the slots of M9 and the bell's feeds (M10).
- **What becomes possible:** spec 006's removal walks (W1, W2) without a human hint, and ADR 0018's plug-and-play
  views.

## Risks

- **The boundary may be too strict for the showcase.** Showcase routes that read modules need an owner or must stop
  reading them. Phase 2 (the showcase split) settles which.
- **Typecheck cost grows with modules.** Revisit if types or check time exceed S1's limits (+10 % and +20 % over the
  S1 baseline).

- **Spec 006 AC5's route snapshot** would fail once W1 or W2 deletes owned routes. It reads the installed modules'
  routes from the generated list.

**The first test** is the one that can prove this record wrong:

1. derive the graph with dependency-cruiser;
2. compare it with C0's edges and the route edges above;
3. time it against S1's limits;
4. then run the W1 walk (remove `catalog`) in a fixture tree.

The staleness test comes after.

## Alternatives considered

- **A monorepo with workspaces (ADR 0003 (a)).** Rejected: it brings the tooling churn ADR 0003 measured, its trigger
  has not fired, and the template's packages would stop being editable.
- **A guide only.** Rejected: C0's table shows 11 to 29 hand edits per removal.
- **Manifests with one hand-written list.** Rejected: every module added or removed is a hand edit to a composition
  file, the edit this record exists to remove.
- **A generator that writes today's central maps** (S1's fallback). Rejected: it keeps the routes', the shell's and the
  tests' couplings that C0 found.
- **Runtime registration or a glob import.** Rejected: ADR 0006 chose static typed arrays (option 3).

**Revisit this record** when typecheck cost passes S1's limits, or when v2 merges conflict in ways that regenerating
does not resolve.

## Amendments to earlier records

- **ADR 0003.** Distribution: the repository as a template, a manifest per module and a generated composition root,
  and a public registry for `ds` pieces only. No monorepo.
- **ADR 0004.** Each preset's seed is split per module. A module's `seed` field replaces `extends` and the
  required-collections list.
- **ADR 0006.** A generator writes the composition of the registries from the manifests, for this record's reason
  (merging v1 into v2, agents). ADR 0006's own trigger has not fired, since presets are still edited by hand. The
  arrays stay static and typed.
- **ADR 0009 and 0016.** The MCP manifest is the kernel entries plus the generated module entries. A hint to an absent
  module is dropped, and `ID_SOURCES` and the instructions' module sentence come from the generated list.
