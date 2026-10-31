# ADR 0006 — Static typed registries, server-read permissions with `can()`, and a gated nav manifest

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` (D4), `ia.md` §1, §3 · Related: ADR 0003–0005

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

**What reference does:**

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
- **The `wide` breakpoint** is a ds token at 1180 px, which matches reference.
- **Visibility is decided on the server; rendering happens in the client.**
  - The dashboard layout computes `visibleNavIds(manifest, access)` with a pure function and passes only the ids.
  - A small client wrapper in `src/app/(main)/dashboard/_components/` takes the active preset's manifest from
    `src/config/vertical.ts`, keeps the visible ids, resolves labels from messages, and feeds the props-driven
    `TopNav`, `AppRail` and `SearchDialog` (ADR 0003).
  - Lucide icons therefore never cross the RSC boundary, and hidden entries never flash.
- **What it replaces:** `sidebar-items.ts` and `shell-items.ts` go away when F4 lands. The showcase screens keep a
  static `examplesNav` in `(examples)`, shown only in the template demo.

### Permissions (`src/core/access`)

**Permission slugs.**

- They use reference's grammar `"<action>:<resource>"` (`read:customers`, `set:customers.vip`,
  `manage:settings`, `export:customers.gdpr`).
- Every slug comes from a capability descriptor (ADR 0005), so the catalogue is derived and cannot drift.
- The reference adapter maps slugs onto reference's own.

**The actor.**

- It comes from the capability `access.me.get`, which returns `{actorId, displayName, roleId, permissions}`. The
  mock answers from the preset's role preset; reference answers from `/v1/me/capabilities`.
- `getRuntime()` (`src/config`, wrapped in `React.cache`) reads it once per request.

**`can()`.**

- `can(access, permission): boolean` is a pure function. An unknown permission returns `false`.
- Server Components call it directly.
- The dashboard layout mounts `<AccessProvider permissions={[...]}>`. Client code calls `useCan()` and gets
  `(permission) => boolean`.

**In screens:**

- **Hide, never disable:** `{can("set:customers.vip") && <VipToggle />}`.
- **Elevated pages** (GDPR, audit) call `notFound()` without permission, as reference's GDPR screen does.
- **Other pages** render a "no access" state from the `forbidden` code.

**Security.** UI hiding is UX only. The adapter checks every call: the mock in its dispatcher, reference in its API.

**Role presets.**

- **Generic ids:** `owner`, `manager`, `staff`, with labels from the preset vocabulary (Propietario, Encargado,
  Personal for hospitality).
- **Defined as rules over the catalogue:**
  - `owner`: everything in the enabled modules;
  - `manager`: all but the elevated permissions (`manage:access`, `export:` and `erase:customers.gdpr`,
    `manage:settings.billing`);
  - `staff`: reads plus operational writes.
- **A contract test checks** that owner ⊇ manager ⊇ staff, and that every role is a subset of the catalogue.

**Location scope** (reference's venue) is deferred until the first screen with a location selector. `can()` then
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
  build-time registry generator. reference's `pnpm gen:registry` is the reference.
