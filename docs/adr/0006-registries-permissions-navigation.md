# ADR 0006 — Static typed registries, server-read permissions with `can()`, and a gated nav manifest

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` (D4), `ia.md` §1, §3 · Related: ADR 0003–0005

> **Amended 2026-10-31 (T6b):**
>
> - **Pure core.** `can(access, permission)` is in `src/core/access/can.ts`; `visibleNavIds(manifest, access,
>   enabledModules)` is in `src/core/nav`. Both are fail-closed. Kernel modules (`access`, `clock`) count as enabled,
>   so an aggregator such as Home gates on `requiredModule: "access"` and every actor sees it. `AccessProvider` and
>   `useCan` are the client entry `src/core/access/client.tsx`.
> - **Data flow.** The dashboard layout reads `getRuntime()`, computes the visible ids on the server and resolves each
>   visible label (`textFor`, preset vocabulary first) and group label. The client receives `NavData` (preset id,
>   visible ids, labels) and picks the entries from `VERTICALS[presetId].nav`; hidden entries are never sent.
>   `buildShellNav` (`_components/nav-model.ts`) turns it into the three props-driven lists.
> - **Manifests list only routes that exist:** Home (`nav.home`, pointing at `/dashboard/default` until T10 builds
>   Home) and Bookings. Staff, resources, catalog and customers come back with their screens. `nav.groups.<group>`
>   labels the search groups; the contract test requires them in four locales.
> - **Examples.** The showcase screens stay reachable as the static `examplesNav`, shown only on the demo build
>   (mock adapter), after the preset's own entries: top-nav pills (Pipeline, Finance, Growth, Schedule, Projects,
>   Customers), rail buttons (Tasks, Email, Chat, Files, Invoice, Products) and the full list, grouped (Dashboards,
>   Pages, Authentication, Legacy), in the search dialog. `default` (now Home), `bookings` and the disabled "Others"
>   placeholder (with its `coming-soon` page) were dropped. Titles are translated by `ExamplesMessages`, keyed by
>   stable ids.
> - **Demo switches** live in the account menu (props-driven `ShellDemo`): role (`demo_role`), preset
>   (`demo_preset`, read first by `getVertical()`, invalid values ignored) and reset. They are Server Actions in
>   `_components/demo-actions.ts`: `unknown` input parsed with zod, cookie attributes like `locale`, refused unless
>   `DATA_ADAPTER=mock`. The cookie is `demo_role`, not `studio_demo_role`. The fake account list is replaced by the
>   acting identity.

## Context

**Navigation today:**

- It is two static files, imported straight into client components:
  - `src/navigation/sidebar/sidebar-items.ts` holds the groups, English titles and Lucide icons;
  - `src/navigation/shell/shell-items.ts` picks `TOP_NAV_IDS` and `RAIL_IDS` out of it.
- Its consumers are `shell/top-nav.tsx`, `shell/app-rail.tsx` and `header/search-dialog.tsx`.
- **No permission exists anywhere.** The account menu lists the demo users from `@/data/users`
  (`top-nav.tsx:14`, `header/account-switcher.tsx`).

**A typed static registry already exists here.** `PREFERENCE_REGISTRY` (`src/lib/preferences/preferences-config.ts`)
is one, serialised into the boot script (`src/scripts/theme-boot.tsx`).

**What the reference console does:**

- **The nav manifest** is `NAVIGATION_MANIFEST`, whose entries carry `requiredPermission` or `requiredModule`
  (`apps/console/src/lib/navigation.ts`).
  - Pure filters (`filter-navigation.ts`) apply it, fail-closed: an entry without a gate is hidden.
  - It is filtered on the server against `GET /v1/me/capabilities`, read once per request.
- **The settings registry** (`lib/settings-registry.ts`) is filtered by `readPermission` the same way.
- **The rule is "hide, don't disable"**, with starter archetypes Propietario, Encargado and Personal.

**Our own requirements:**

- Spec D4 makes permissions part of every slice's acceptance.
- `ia.md` §1 defines the levels: top-nav areas, a tools rail, L2 views and L3 records.

## Options considered

**Registries:**

1. **Runtime registration** (modules call `registerLayer()` as a side effect).
   - *Pros:* plugin-like.
   - *Cons:* Next builds separate server and client module graphs, so a registration that runs in one graph is
     missing in the other. It is also order-dependent, defeats tree-shaking and is hard to test.
2. **File-system discovery** (glob imports).
   - *Cons:* bundler-specific magic.
3. **Static typed arrays (chosen).**
   - *How:* the entry type belongs to the consumer, modules export entry descriptors, and the preset assembles
     and orders the arrays.

**How permissions reach the UI:**

1. **A zustand store hydrated on the client.**
   - *Cons:* zustand fits client-owned mutable state (preferences, `chat/_components/use-chat.ts`), but the actor
     is server-owned. It would still need a server read to hide entries before the first paint.
2. **A server read plus React context (chosen).**
3. **Prop drilling.**
   - *Cons:* noise through every layer.

## Decision

### Registries

| Registry | Type owned by | Entries declared by | Array owned by | Consumers |
| --- | --- | --- | --- | --- |
| Nav manifest | `src/core/nav` | preset | preset `nav` | shell, `⌘K` search |
| Agenda layers | `src/engines/agenda` | modules (`bookings` → reservations; `staff` → shifts, leave; `tasks` → due tasks; `settings` → closures) | preset `registrations.agendaLayers` | Agenda page, Bookings › Agenda, staff record, Inicio strip |
| Channels | `src/core/channels` | core ships the generic catalogue of **media** (`phone`, `email`, `web`, `in_person`, `whatsapp`, `instagram`, `facebook`, `sms`, `google`, `third_party`). Who created a booking is `Booking.origin` (`staff`, `online`, `walk_in`, `assistant`), not a channel (amended after the T1 spike, 2026-10-31) | preset (subset, plus vertical providers) | booking chip and filter, inbox, analytics |
| Notification types | `src/engines/feed` | modules (`bookings.created`, `staff.leave.requested`, `approvals.pending`, …) | preset (subset and default routing) | bell, Inicio decisions, Settings › Alerts |
| Settings sections | `src/engines/settings-form` | modules (every business rule with schema and default, ADR 0004) | preset (groups, order, default overrides) | Settings, per-area settings tabs |
| Record sections | `src/engines/record-panel` | modules, plus preset extensions (allergy strip, vehicles) | preset | L3 records |
| Booking views | `src/modules/bookings` | module (`agenda`, `list`), plus preset extensions (`floor`) | preset | bookings route |
| Role presets | `src/core/access` | preset | preset `roles` | mock adapter |

**Rules for every registry:**

- **Entries are serialisable descriptors:** ids, `labelKey`, tone, permission and capability id. Behaviour that
  needs code lives either in a server-side mapper or in a client component reference from a `ui.ts` entry. Only
  data crosses the RSC boundary.
- **Arrays are plain `as const satisfies readonly T[]`.** They are never mutated and never registered at runtime.
- **A contract test (ADR 0008) checks every preset:**
  - unique ids;
  - every entry refers to an enabled module;
  - every permission exists in the catalogue.
- **The agenda engine follows FullCalendar's model:**
  - each layer maps to an `eventSources` entry with an id, and turning a layer off removes its source (FullCalendar
    has no built-in hide);
  - ResourceTimeline is our own custom view (`views={{ resourceTimeline: View }}` with `sliceEvents`), because
    FullCalendar's resource views are a commercial plugin;
  - `src/components/calendar/` stays untouched; the engine wraps it.

### Nav manifest (`src/core/nav`)

> **Amended 2026-10-31 (T4):** `labelKey` points at a text message of a module (`bookings.title`), not at a separate
> `nav` dictionary. The contract test requires it to resolve to a string in all four locales.

> **Amended 2026-11-03 (S2):** business settings are a registry too. A module declares them with `defineSetting` (key
> `<module>.<path>`, zod schema, typed default, section, write permission, label and description keys) and
> `src/config/settings.ts` merges them. They are read through the kernel capability `settings.values.get`
> (`read:settings`, tier 0, held by every role; `settings` joins the kernel modules) and, in handlers, through the
> `settings` reader of the mock context. An unknown key is the error `settings.unknown_key`.

```ts
export interface NavEntry {
  readonly id: string;                        // stable: "bookings"
  readonly href: string;                      // "/dashboard/bookings"
  readonly labelKey: string;                  // key in the `nav` messages (preset vocabulary can override)
  readonly icon: LucideIcon;
  readonly placement: "area" | "tool";        // top-nav pill vs tools rail (ia.md §1)
  readonly group: string;                     // preset group id; labels come from messages
  readonly presentation?: "always" | "wide";  // "wide": shown from the `wide` breakpoint, in "More" below
  readonly requiredPermission?: Permission;   // decides when present
  readonly requiredModule?: ModuleId;         // aggregator screens only
}
```

- **Fail-closed.** An entry with neither gate is hidden. A gate on a disabled module is hidden.
- **The `wide` breakpoint** is a ds token at 1180 px, which matches the reference console.
- **Visibility is decided on the server; rendering happens in the client.**
  - The dashboard layout computes `visibleNavIds(manifest, access)` with a pure function and passes only the ids.
  - A small client wrapper in `src/app/(main)/dashboard/_components/` takes the active preset's manifest from
    `src/config/vertical.ts`, keeps the visible ids, resolves labels from messages, and feeds the props-driven
    `TopNav`, `AppRail` and `SearchDialog` (ADR 0003).
  - Lucide icons therefore never cross the RSC boundary, and hidden entries never flash.
- **What it replaces:** `sidebar-items.ts` and `shell-items.ts` go away when F4 lands. The showcase screens keep a
  static `examplesNav` in `(examples)`, shown only in the template demo.

### Permissions (`src/core/access`)

> **Amended 2026-10-31 (T4):** "elevated" is a flag on the capability descriptor (`elevated: true`, ADR 0005), not a
> hand-written list in core. A role rule grants a permission slug only if every capability carrying it passes the
> rule, so a slug shared by a safe and a destructive or elevated capability is never granted by accident. A contract
> test requires one effect and one elevated flag per slug.

**Permission slugs.**

- They use the reference console's grammar `"<action>:<resource>"` (`read:customers`, `set:customers.vip`,
  `manage:settings`, `export:customers.gdpr`).
- Every slug comes from a capability descriptor (ADR 0005), so the catalogue is derived and cannot drift.
- The the reference console adapter maps slugs onto the reference console's own.

**The actor.**

- It comes from the capability `access.me.get`, which returns `{actorId, displayName, roleId, permissions}`. The
  mock answers from the preset's role preset; the reference console answers from `/v1/me/capabilities`.
- `getRuntime()` (`src/config`, wrapped in `React.cache`) reads it once per request.

**`can()`.**

- `can(access, permission): boolean` is a pure function. An unknown permission returns `false`.
- Server Components call it directly.
- The dashboard layout mounts `<AccessProvider permissions={[...]}>`. Client code calls `useCan()` and gets
  `(permission) => boolean`.

**In screens:**

- **Hide, never disable:** `{can("set:customers.vip") && <VipToggle />}`.
- **Elevated pages** (GDPR, audit) call `notFound()` without permission, as the reference console's GDPR screen does.
- **Other pages** render a "no access" state from the `forbidden` code.

**Security.** UI hiding is UX only. The adapter checks every call: the mock in its dispatcher, the reference console in its API.

**Role presets.**

- **Generic ids:** `owner`, `manager`, `staff`, with labels from the preset vocabulary (Propietario, Encargado,
  Personal for hospitality).
- **Defined as rules over the catalogue:**
  - `owner`: everything in the enabled modules;
  - `manager`: all but the elevated permissions (`manage:access`, `export:` and `erase:customers.gdpr`,
    `manage:settings.billing`);
  - `staff`: reads plus operational writes.
- **A contract test checks** that owner ⊇ manager ⊇ staff, and that every role is a subset of the catalogue.

**Location scope** (the reference console's venue) is deferred until the first screen with a location selector. `can()` then
gains an optional `scope`.

### Dev-only switches (account menu)

- **They appear only when `DATA_ADAPTER=mock`.**
- **"View as" role:** a Server Action sets `studio_demo_role`, then calls `refresh()`.
- **Preset (ADR 0004)** and **language (ADR 0007)** use the same mechanism. The language switch remains in
  production.
- **Reset demo data** (ADR 0005).

## Consequences

- **Spec D4 becomes testable.** The Playwright role matrix (ADR 0008) checks that areas, tools and gated actions
  disappear for manager and staff.
- **The dashboard layout becomes a dynamic Server Component** that reads the session cookies. The shell components
  stay client-side and props-driven.
- **Adding a nav entry, layer, channel, notification type or settings section** touches two places: the module
  that declares it and the preset that lists it. Nothing registers itself.
- **Reversal is cheap.** Arrays and context sit behind small types.
- **Revisit when:** third parties need to add modules without editing a preset (a plugin market). Then add a
  build-time registry generator. the reference console's `pnpm gen:registry` is the reference.
