# ADR 0020 — Record pages: a record with history and facets gets a page of its own

Status: proposed (the owner asked for these pages on 2026-11-05; the pattern awaits the owner's acceptance) · Date:
2026-11-05 · Spec: `docs/specs/012-record-pages/spec.md` · Amends: ADR 0015 (window table), ADR 0006 (the staff nav
entry) · Related: ADR 0005, 0007, 0016, 0017, 0019

## Context

- **No record can be opened today.**
  - The customers directory links only to `mailto:` and `tel:`.
  - The customers module's `get`, contact update, notes and block capabilities have no screen.
  - ADR 0015 assigns "look at a record and act on it" to `RecordPanel`, which was never built.
- **The only record-shaped screen is static.** `/dashboard/profile` shows Alex Morgan, the demo's signed-in person,
  and is a future product screen of `staff` (006 critique 1). Its breadcrumb names five levels that are plain text, and
  two of them ("Personas", "Directorio de empleados") are pages that do not exist.
- **The team has data and no screen.** `staff` seeds members and shifts in every preset and exposes only `staff.list`.
  ADR 0006 removed the team's nav entry until its screen came back.
- **What the trade does.**
  - Shopify admin and Stripe's dashboard open a customer at `/customers/{id}`; HubSpot opens a record page. Each has a
    deep link, a trail back to the list, a header with the record's state and actions, and its facets in tabs or
    sections.
  - A breadcrumb shows the place in the site's hierarchy. Every level but the current page is a link, and the trail is
    a labelled `nav` with the current page marked `aria-current="page"` (NN/g, "Breadcrumbs: 11 Design Guidelines";
    W3C WAI-ARIA APG, "Breadcrumb").

## Decision

### 1. A record page

- **When to use one.** A record with history or several facets gets a page at `/dashboard/<collection>/[id]`. The
  first two are the customer and the team member.
- **Loading.** The page loads the record on the server through its module's `get` capability. A record that does not
  exist renders Next's not-found page. A read that fails shows the kit's `ReadState` with an actionable message.
- **Layout, top to bottom:**
  - the trail;
  - a header with the identity, the state badges and the primary actions;
  - tabs for the facets;
  - an overview with a state column. From 1024 px the column sits on the right; below that it follows the overview.
- **Windows.** The page holds no form of its own: every action opens a window chosen by ADR 0015's table. A window
  opens above the page and never narrows or reflows it.
- **Privacy.** A record page is `noindex` and stays out of the sitemap, since it shows a person's data.
- **One read.** `generateMetadata` and the page share one cached loader, so the record is read once per request.

### 2. The trail is a kit piece

- **The piece.** `PageTrail` (`src/ds/components`) takes a list of `{ label, href }` and a current label. It renders
  the shadcn breadcrumb, with `next/link` on every level but the last.
- **Every level is a page that exists.** No page writes its own trail. A level that is not a page, such as a tab name
  or a section label, is left out.
- **Checked by a test.** The e2e test follows every link in a trail and expects a page.

### 3. ADR 0015's table, amended

| Job | Window |
| --- | --- |
| Look at a record with history or several facets, and act on it | A record page (§1); its actions use the windows below |
| Look at a record without leaving a task (the floor, a day's bookings) | `RecordPanel`, on `ResponsivePanel` |

- `RecordPanel` stays the answer inside a task, and it is built when a task needs it.
- A record page's reversible action (unblocking a customer) acts at once and offers undo, per ADR 0015.

### 4. Owners and dependencies

- **Routes.** A record page lives in its module's route folder and is owned with it (ADR 0017 §4): `customers` owns
  `customers/[id]`, and `staff` owns `/dashboard/staff` and `/dashboard/staff/[id]`.
- **No cross-module reads.** A page reads only its own module's capabilities. A facet that belongs to another module
  waits for that module to fill a slot of the route (ADR 0017 §4, M9). A customer's bookings are one such facet.
- **Fields stay with their capability's permission.** A field that needs a stronger permission than the record is
  left out of the record's outputs and read through its own capability, and its tab is hidden without that
  permission (ADR 0006).
  - The team member's contract is one such field. `staff.list` and `staff.get` leave it out, and
    `staff.contract.get` (`read:staff.contracts`) is a `restricted` read: the owner and the manager hold it, staff do
    not, and no role level is added.
  - It is UI-only on the MCP, as `approvals.list` is: no assistant job needs employment terms.
- **Generic screens never read `ext`** (ADR 0004), so a preset's pay or vehicle fields stay off these pages until the
  record sections registry (ADR 0006) gives them a place.
- **Roles keep the permissions they hold.** The customer page shows block and unblock to every role that holds
  `block:customers`, staff included, as `src/config/customers.test.ts` pins today.

### 5. The profile's trail

The profile stays where it is. Its trail becomes the nav's Home, linked, then "Profile", and the account menu's
"Account" opens it, since it shows the signed-in person.

### 6. Words for data

A record page shows values a business types, such as a team member's skills, and later a contract's type and an
asset's kind. They are data, not module messages, so a vocabulary cannot override them (ADR 0004's contract test).

- **Where they live.** Each preset's server half carries `terms`, a dictionary by family and id
  (`terms.skills.sommelier`) in the four locales.
- **How a screen reads them.** One reader, `termLabel(preset, locale, family, id)`, returns the preset's word, or the
  id as typed when there is none. It never throws, since a business adds values the preset never saw.
- **What it allows.** A new family only adds keys; leak terms are allowed there, as they are in a preset's vocabulary.

## Consequences

- **What it gives.** Every customer and team member has a link that can be shared within the team, and Back returns
  to the list. The parties screen (ADR 0019) and later collections follow the same shape.
- **What it costs.** Two routes, a third later, plus `PageTrail` and a test that follows every trail link.
- **Not yet.** A customer's bookings are absent from their page until the slot mechanism lands (M9).
- **Back.** Back returns to the list, but the list's own filters live in component state today, so they reset; keeping
  them is a separate change (the URL, or Next's `cacheComponents`).

## Alternatives considered

- **`RecordPanel` for every record.** Rejected. A sheet above the page (`ResponsivePanel`) has no deep link, Back does
  not close it into the list, and its width is too narrow for a record with notes, contact details, assets and later a
  history in tabs.
- **A page per facet** (`/customers/[id]/notes`). Rejected for now: the facets are short, and tabs keep them one
  click apart. A facet that grows its own navigation can take a segment later.
- **Keeping the profile's trail.** Rejected: a trail of levels that are not pages misleads, and the owner reported it
  on 2026-11-05.
- **Moving the profile under `(examples)`.** Rejected: 006 accepted it as a future product screen of `staff`.

## Amendments to earlier records

- **ADR 0015.** The table gains the record page row of §3, and `RecordPanel` is scoped to looking at a record without
  leaving a task. The window table in `.claude/skills/admin-os-ui/SKILL.md` follows on acceptance.
- **ADR 0006.** The team's nav entry returns with its screen (`/dashboard/staff`), gated by `read:staff`. Its label is
  the preset's word for its staff.
- **ADR 0004.** The preset contract gains `terms` (§6) in `server.ts`, beside `vocabulary`.
