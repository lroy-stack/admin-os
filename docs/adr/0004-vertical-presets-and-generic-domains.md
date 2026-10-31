# ADR 0004 — Verticals are presets over generic domain modules; reservations become bookings + a floor extension

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` · Related: ADR 0003, 0005–0008

## Context

**Who the kit is for.** It is for any small business. Hospitality (reference) is the reference vertical and is built
fully. A salon (appointments by stylist and chair, a services catalog, commissions) and a workshop (work orders,
vehicles as customer assets, bays, parts, quotes and invoices) stress-test the names and contracts.

**reference's rules.**

- No hard-coded business data: name, city, currency.
- Every business rule is a setting, with a default chosen by industry practice (reference `CLAUDE.md`).

**Restaurant vocabulary already sits in generic places:**

- `src/navigation/shell/shell-items.ts:4` lists `reservas` among the top-nav ids, and the route slug is the Spanish
  `/dashboard/reservas`.
- `reservas/_components/reservations-data.ts` mixes three things:
  - seed data: Spanish surnames, `language: "Spanish"`;
  - a channel list: `web | phone | walk-in | assistant`;
  - business rules: `LATE_AFTER_MIN = 10` and a fixed `SERVICE_NOW_MIN`.
- `floor/floor-model.ts` names the item `DiningTable`, with landmark kinds bar / kitchen / restrooms.
  `floor/table-geometry.ts` places chairs around tables, and `floor/venue.ts` holds the mock room.
- reference's booking statuses include `seated` and `pending_payment`, and its booking carries `blockedSeats`
  (`packages/contracts/src/operations/booking-summary-view.ts`).
- `src/lib/utils.ts:27-28` defaults `formatCurrency` to USD / `en-US`.

## Options considered

1. **Restaurant-first naming; other verticals fork the repo.**
   - *Pros:* fastest for reference.
   - *Cons:* the template is not generic, and the forks diverge.
   - *Effort / reversal:* S / L (renames spread everywhere later).
2. **A runtime metamodel** (entities and fields defined as data, low-code style).
   - *Pros:* fits any business.
   - *Cons:* weak typing, every screen generic and lowest-common-denominator, a huge scope, speculative.
   - *Effort / reversal:* L / L.
3. **Generic domain modules with typed extension slots, plus vertical presets (chosen).**
   - *How:* code names the generic concept. A preset brings vocabulary, nav, enabled modules, registrations, seed
     data and vertical-only extensions.
   - *Proof:* a thin second preset.
   - *Effort / reversal:* M / M.

## Decision

Option 3.

### The preset contract (`src/verticals/<id>/`, ADR 0003 entries)

| Entry | Field | Content |
| --- | --- | --- |
| `index.ts` | `id` | `"hospitality"`, `"salon"`, … |
| | `modules` | The enabled `ModuleId[]`. A disabled module grants no permission, so its nav, layers, sections and notification types hide (fail-closed, ADR 0006) |
| | `nav` | `NavManifest` (ADR 0006) |
| | `roles` | `RolePreset[]`: `owner`, `manager`, `staff` |
| | `registrations` | `agendaLayers`, `channels`, `notificationTypes`, `settingsSections`, `bookingViews`, `recordSections` (ADR 0006) |
| | `extensions` | zod schemas for the `ext` slot of each entity it extends |
| `server.ts` | `vocabulary` | Per-key overrides of module messages, as `Record<Locale, string>` for en / es / de / fr (ADR 0007) |
| | `settingsDefaults` | Industry defaults for module settings (for example `bookings.late_after_minutes = 10`) |
| | `seed` | Mock datasets per module, parsed with the module schemas. Business profile: name, currency, time zone, business-day cut-off, mock clock |
| `ui.ts` | — | Vertical-only client extensions (hospitality: the floor view) |

### Rules for presets

- **Business data lives only in `src/verticals/*/server.ts` seeds.** Generic layers contain none (see the leak
  check in ADR 0008).
- **Modules never read the preset.** They receive registrations and settings through the composition root
  (`src/config`), so a screen never branches on `preset.id`.

### Selecting the active preset

- **Where:** `src/config/vertical.ts`.
- **Pinned deployments:** the `VERTICAL` environment variable pins one preset per deployment.
- **Demo mode** (mock adapter only): a `studio_demo_vertical` cookie, set from the account menu, switches the preset
  at runtime. One build then serves both presets for the public demo and for Playwright.
- **A scaffolded app** keeps one preset.

### Generic names in code, vertical labels in dictionaries

| Code name | Hospitality (en / es) | Salon | Workshop |
| --- | --- | --- | --- |
| `customers` | Guests / Clientes | Clients | Customers |
| `bookings` | Reservations / Reservas | Appointments | Drop-off appointments |
| `resources` (+ `areas`) | Tables / Mesas; rooms Sala, Terraza | Chairs, stations | Bays, lifts |
| `staff` | Team / Equipo | Stylists | Mechanics |
| `catalog` | Menu / Carta | Services | Parts and labour |
| `vouchers` | Passes / Pases | Gift cards, prepaid packs | — |
| `tasks` | Tasks / Tareas | Tasks | Work orders (extension) |
| `conversations`, `notifications`, `settings` | Messages, alerts, settings | same | same |
| `location` | Venue / Local | Salon | Branch |
| `booking.partySize` | Covers / Comensales / Gedecke / Couverts | hidden | hidden |
| status `in_progress` | Seated | In the chair | In the bay |

**Route slugs follow the code names** (`/dashboard/bookings`, `/dashboard/customers`, …).

- **When:** each slug is renamed in the slice that redesigns its page, with a redirect from the old slug in
  `next.config.mjs` `redirects()`.
- **First:** `reservas` → `bookings`, because it is the only Spanish and vertical slug in a generic layer.
- **Approval:** this amends spec D1 ("paths kept") for the template and needs the owner's acceptance. reference's port
  keeps reference's own slugs.

### Contracts: what is generic and what is a vertical extension

**How a field becomes generic.** It enters a module schema only when **at least two presets** need it. Until then
it lives in the entity's `ext` slot, typed by the preset's `extensions` schema, and is rendered only by
preset-registered record sections. Generic screens never read `ext`.

| Module / engine | Generic contract | Hospitality extension | Salon (proof: seed and labels only) | Workshop (paper only) |
| --- | --- | --- | --- | --- |
| **bookings** | `Booking {id, status, businessDay, startMin, endMin, resourceIds[], staffIds[], customerId?, partySize ≥ 1, lines[] (catalogItemId, qty, durationMin, price), channel, guestNote, staffNote, tags}`. Lifecycle `pending → confirmed → in_progress → completed`, plus `cancelled` and `no_show`. Views: agenda (ResourceTimeline), list, sheet | Covers sizing, blocked seats, table merge, deposits and no-show fee, event or large-group type, floor view | Stylist = `staffIds`, chair = `resourceIds`, services = `lines`, duration = Σ lines | Drop-off slot on a bay; the vehicle goes in `ext` until a second preset has assets on bookings |
| **resources** | `Resource {id, kind (preset vocabulary), label, areaId, capacity?, active}`, `Area {id, label, levelId?}`. The plan geometry joins later (see below) | Tables, zones, floor plan | Chairs, rooms | Bays, lifts |
| **catalog** | `CatalogItem {id, kind: product \| service \| bundle, name (i18n field), categoryId, price, durationMin?, status active / inactive / archived, media, tags}`. A bundle has sections of items (menus, packs) | EU-14 allergens, pairings, dish of the day, tasting menu = bundle with courses | Service duration, required skill, commission rate | Parts (SKU, stock, supplier), labour rates |
| **customers** | `Customer {id, name, contacts[], consent, tags, vip, blocked, notes, figures {visits, spend, lastVisit, noShows}}`, `Asset {id, customerId, kind, label}` with attributes in `ext` | Allergy and diet strip, seating preferences | Colour formulas (in `ext`) | Vehicles as assets (plate, VIN, make, model, mileage) |
| **staff** | `StaffMember {id, name, roleIds, status, locationIds, contract, skills[]}`, `Shift`, `Attendance`, `Leave` | Crew and XP, academy credentials, tips | Skills; commission in `ext` | Certifications; hours per job in `ext` |
| **tasks** (board engine) | `Task {id, title, status (columns from the preset), assignee: staff \| role \| shift, dueAt?, checklist, links: EntityRef[]}` | Opening and closing checklists, mise en place | — | Work order = task + lines + asset + quote → invoice (a workshop extension module) |
| **vouchers** | `Pass {id, programId, holderId, balance \| stamps, status, expiresAt}`, `Program`, `Movement` | reference Pass, wallet card | Gift card, prepaid pack | — |
| **conversations** (inbox engine) | `Conversation {id, channel, participants, assigneeId, links}`, `Message` | WhatsApp booking intake | Reminders | Quote approval by SMS |
| **agenda** engine | `AgendaLayer` and `AgendaItem` (ADR 0006), resources as rows | Reservations, shifts, closures | Appointments by stylist | Bays by day |

### Where the reservations module belongs

**Decision:** a generic `bookings` module plus a **hospitality floor-plan extension**, registered as a bookings
view.

**Why it is not vertical-only:**

- The booking lifecycle, list, agenda, sheet and channel chip are what every vertical needs.
- The 3D scene and camera are already domain-free: `floor-scene.ts`, `camera-math.ts`, raycast picking and the
  `FloorView` wrapper of ADR 0001.

**Why it is not fully generic now:**

- Seats around tables (`table-geometry.ts`), covers sizing, landmark kinds and the table labels only make sense in
  hospitality.
- No second vertical asks for a spatial view: salons and workshops plan by person or bay, which is the
  ResourceTimeline.

**Steps:**

1. **S1, when the bookings seam lands:**
   - `table-state.ts` and `reservation-status.ts` take `now` and `lateAfterMin` as parameters instead of importing
     them;
   - `LATE_AFTER_MIN` becomes the setting `bookings.late_after_minutes`;
   - the clock comes from the `clock.get` capability (ADR 0005);
   - `reservations-data.ts` and `floor/venue.ts` move to `src/verticals/hospitality/server.ts` seeds.
2. **S3b (Reservas parity):**
   - the route is renamed `bookings` and reads through the seam;
   - `reservas/_components/floor/` moves to `src/verticals/hospitality/floor/` and is registered as the `floor`
     booking view;
   - the floor plan's localStorage persistence is replaced by `resources.plan.*` capabilities.
3. **Second consumer of the scene** (Configuración › Sala lighting preview, S10):
   - `floor-scene.ts`, `camera-math.ts`, `room-meshes.ts` (without seats) and `floor-view.tsx` move to
     `src/engines/space-scene`;
   - levels, zones, openings, placements and `plan-edits.ts` become the `resources` plan contract. Generic names:
     `PlacedResource` replaces `DiningTable`, and landmark kinds become a preset registry;
   - seats, covers and landmark vocabulary stay in hospitality.
4. **`rail/rail-plan.ts`** is generic (load over time). It stays route-local until a second consumer appears.

### The proof: a thin salon preset

`src/verticals/salon` ships only:

- `nav`;
- `roles`;
- `vocabulary` in four locales;
- seed: customers, stylists as staff, chairs as resources, services as catalog items, and appointments with
  `lines`;
- business settings: currency and time zone.

It runs on the same modules and routes, with no salon features: no commissions, no formulas.

It is the **contract test that nothing is restaurant-coupled** (ADR 0008): every route in the salon nav renders
with salon data, and no hospitality-only string appears. The workshop stays on paper: its seed sketch is part of the
spike below and is not shipped.

### First spike, before S1: the riskiest assumption

**The assumption:** one set of generic contracts serves hospitality, salon and workshop while staying a
near-identity mapping of reference's capability outputs.

**The spike** (size S–M, vitest only, no UI):

1. Draft zod schemas for `Booking`, `Customer` + `Asset`, `CatalogItem` and `StaffMember`.
2. Write the hospitality seed from `reservations-data.ts`, the salon seed, and the workshop seed sketch.
3. Write the reference → generic mappers for `BookingSummaryView` and the customer profile.

**Pass when:**

- all seeds parse;
- no preset needs a generic field outside `ext`;
- each mapper is only field renames and enum maps (for example `seated` ↔ `in_progress`), with no derived logic.

**Fail means:** the generic names are wrong. Fix the contracts before S1 builds on them.

### Spike result (T1, 2026-10-31): passed, with contract changes

**What passed:**

- The hospitality, salon and workshop seeds parse with the generic `bookings`, `customers`, `catalog`, `staff` and
  `resources` schemas and with their preset `ext` schemas.
- No generic schema reads `ext` (`src/modules/ext-guard.test.ts`).
- reference's `BookingSummaryView` and customer profile map by renames and enum maps (`seated` → `in_progress`,
  `pending_payment` → `awaiting_payment`, `source` → `origin`). On top of that, the mappers:
  - take **request context**: `currency`, plus `businessDay` until reference exposes `serviceDate`;
  - make structural wraps: menu → one line, deposit fields → `deposit`;
  - convert the wire form of the bigint deposit amount.

  Their extension data validates against the hospitality `ext` schemas
  (`src/verticals/hospitality/reference-mapping.test.ts`).

**Contract changes the spike forced:**

| Where | Change |
| --- | --- |
| bookings | `partySize` defaults to 1 |
| | `contactName?` for bookings without a customer record |
| | `deposit?` and the status `awaiting_payment`, backed in two presets |
| | `origin` (`staff | online | walk_in | assistant`) split from an optional core `channel` (ADR 0006 amended) |
| | lines get an optional `durationMin` and a `unitPrice` |
| | the unrefined `bookingObject` is exported for derived inputs |
| customers | `email?` and `phone?` replace `contacts[]` |
| | `consent` and `locale` are optional |
| | `lastVisit` is an ISO datetime |
| staff | `contract?` |
| core | `Money`, `LocalizedText {source, translations}` (partial per locale), `CHANNELS` and the clock primitives live in `src/core` |

**Not done:** UI labels are never seeds; walk-ins are labelled from `origin`.

## Consequences

- **Indirection.** Labels come from dictionaries and vertical data sits behind `ext`. Generic screens become a
  little more abstract, but they never branch on the vertical.
- **The reference adapter maps names** (`in_progress` ↔ `seated`, `location` ↔ `venue`, permission slugs). The
  spike measures that cost.
- **Reversal costs medium.** Names spread across schemas, dictionaries and routes, so they are fixed here and
  checked by the spike before S1.
- **Revisit when:**
  - a preset needs a different screen layout, not just different labels or sections, on more than two screens.
    Then add a screen-variant registration;
  - the salon proof needs a hospitality field. Then the generic contract is wrong and gets redesigned.
