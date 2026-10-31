# admin-OS

**An open-source management dashboard for small businesses.** It is built for restaurants first, and it is designed
so that a hair salon or a car repair workshop can run on the same modules. No AI slop, no over-engineering: well
designed, reusable at every level, and ready to be managed by an AI assistant through its own MCP server.

> [!NOTE]
> admin-OS is in active development towards its first release (`v0.1`). Some modules below are built, others are
> in progress. See [Status](#status).

## What it does

- **Bookings with a live floor plan.**
  - The room renders in 2D, 2.5D or 3D with table states you can read from across the room.
  - An arrivals rail is planned by time slot.
  - A room editor handles several levels.
  - A full-screen service view gives the floor and the rail the whole screen.
- **Liquid-glass interface.** A glass shell with five themes (Lime, Ember, Rose, Tide, Cobalt), each in light and
  dark, layout controls and a responsive layout that works on phones.
- **Vertical presets.** One codebase serves different businesses: hospitality (tables and covers), salons (chairs and
  services) and workshops (bays and vehicles). Generic domain modules sit underneath and only the vocabulary and seed
  data change.
- **Four languages.** English, Spanish, German and French, with complete dictionaries (in progress).
- **Pluggable data layer.** Every screen reads and writes through typed capabilities. A mock adapter ships for
  demos; a real backend replaces one adapter.
- **MCP server** (planned for `v0.1`), so any MCP-capable AI assistant can operate the dashboard.

## Status

| Area | State |
| --- | --- |
| Shell, glass design system, theme presets | Done |
| Bookings: floor plan, rail, editor, full view | Done (mock data) |
| Generic domain contracts (bookings, customers, catalog, staff, resources) | Done, proven on three vertical seeds |
| Data seam, permissions, i18n (en / es / de / fr) | In progress |
| Customers CRM, agenda, team, catalog, messaging, tasks | Planned for `v0.1` |
| MCP server, landing page | Planned for `v0.1` |

## Tech stack

- **Framework:** Next.js 16 (App Router, React Compiler), React 19, TypeScript, Tailwind CSS v4.
- **UI:** shadcn/ui on Radix UI and Base UI, Lucide icons.
- **Data and forms:** TanStack Table, Zod, React Hook Form, Zustand.
- **Calendar and boards:** FullCalendar 7, dnd-kit.
- **3D floor plan:** three.js.
- **Tooling:** Biome, Vitest, Husky.

## Architecture

Code is organised in package-shaped layers with one dependency direction, enforced by lint. Extracting a layer into
its own package is a move, not a rewrite.

```text
core ← ds ← engines ← modules ← verticals ← config ← app
```

| Folder | Holds |
| --- | --- |
| `src/core` | Contracts: results and errors, capabilities, money, i18n, clock, channels |
| `src/ds` | Design system: tokens, glass styles, presets, shared components, shell, preferences |
| `src/modules` | Generic domains: bookings, customers, catalog, staff, resources |
| `src/verticals` | Presets: hospitality (reference), salon, workshop |
| `src/app` | Thin routes |

Architecture decisions live in [`docs/adr`](docs/adr).

## Getting started

```bash
git clone https://github.com/lroy-stack/admin-os.git
cd admin-os
npm install
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

| Command | Does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit and contract tests (Vitest) |
| `npm run check` | Lint and format check (Biome) |

## Credits

admin-OS started from [next-shadcn-admin-dashboard](https://github.com/arhamkhnz/next-shadcn-admin-dashboard) by
Mohammed Arham Khan (MIT), whose shell, screens and theme system it builds on.

## License

[MIT](LICENSE)
