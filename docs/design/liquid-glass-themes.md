# Liquid-glass themes

Date: 2026-10-31 · Spec: [001 v0.1](../specs/001-v0-1/spec.md) (AC3) · Plan: T7 · Related: [ADR 0002](../adr/0002-liquid-glass-refraction.md)

Liquid glass is the material, not a palette. Every theme uses the same glass (frosted cards, liquid-glass capsules,
sliding thumb, page transitions) and has a real light and dark version.

## How a theme is built

- **Shared semantic layer** (`src/ds/styles/tokens.css`). `:root` holds light mode and `.dark` holds dark mode. It
  derives every role (background, foreground, card, popover, muted, border, chart, sidebar, glass fill, rim, shadow,
  thumb, room neutrals) from a few primitives.
- **Preset** (`src/ds/styles/presets/<id>.css`). It supplies only the primitives:
  - `--tint-hue`, the hue of the neutral base;
  - the brand trio (`--brand`, `--brand-foreground`, `--salmon`, `--azure`) per mode;
  - the four coloured table states;
  - `--app-backdrop` and `--app-backdrop-overlay` per mode.
- **Light glass** uses translucent white fills (cards 58 %, capsules 42 %, chrome 80 % of the background) and
  `brightness(1.04)`. It has a white specular edge, a dark hairline and soft shadows tinted with the theme hue, and
  dark text.
- **Dark glass** keeps the original material: 5 % white cards, a 6 % white capsule fill, an 80 % chrome fill,
  `brightness(0.96)`, lit rims and white text.
- **Accent strength per mode.** Brand and series fills carry `text-background` (avatars, KPI badges). So in light mode
  the trio is ink-strength (about L 0.52–0.55) with near-white text, and in dark mode it is pastel with dark text. The
  room is white in both modes, so the table states always use the light-mode inks.
- **Reduced transparency** (`@media (prefers-reduced-transparency: reduce)` in tokens.css). Cards, popovers, sidebar
  and capsules switch to the opaque `--surface-solid`, card blur and the app backdrop are removed, and rims and depth
  stay.

## Study

The series roles keep their token names: `--salmon` is the alert role (late, at risk, full) and `--azure` is the
middle role (leaving, middling, busy). Values are OKLCH; "light / dark" means light-mode / dark-mode value.

| Theme (id) | Brand light / dark | Salmon role light / dark | Azure role light / dark | Neutral hue | Light backdrop | Dark backdrop | Rationale |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Lime** (`lime`), default | `0.52 0.15 132` / `0.915 0.165 120.51` | red `0.54 0.15 33` / `0.77 0.092 37.71` | blue `0.54 0.12 258` / `0.766 0.096 259.88` | 128.8 warm olive | warm paper, lime, sky and amber blooms | the original olive and amber scene, its brightest blooms dimmed | The reference skin the owner chose; fresh and energetic for any business; also the landing's theme. |
| **Ember** (`ember`) | tangerine `0.55 0.16 45` / `0.79 0.15 55` | berry `0.53 0.17 360` / `0.79 0.11 355` | teal `0.53 0.09 200` / `0.79 0.09 195` | 55 warm clay | candlelit linen, peach, apricot and rose | embers: amber, terracotta, berry, a teal edge | Restaurants and bars: warm and appetising; berry keeps the alerts apart from the orange brand. |
| **Rose** (`rose`) | rose `0.54 0.17 355` / `0.81 0.12 355` | apricot `0.54 0.14 55` / `0.81 0.11 65` | sage `0.52 0.08 170` / `0.8 0.08 165` | 350 blush | blush and champagne with a sage leaf | plum velvet: rose, mauve, champagne | Salons and studios: soft and personal, without the violet sameness of the old soft-pop. |
| **Tide** (`tide`) | sea teal `0.52 0.1 195` / `0.83 0.11 190` | coral `0.55 0.16 28` / `0.77 0.12 28` | iris `0.52 0.15 290` / `0.77 0.1 290` | 215 cool slate | seafoam and wet sand | deep water: teal, green-blue, sand glint | Clinics, spas and calm services: the one cool, quiet theme. |
| **Cobalt** (`cobalt`) | cobalt `0.52 0.17 260` / `0.75 0.14 258` | signal red `0.55 0.19 30` / `0.78 0.13 32` | amber `0.54 0.11 75` / `0.85 0.13 82` | 255 graphite (near-neutral) | brushed steel, cobalt and amber glints | graphite workshop, cobalt lamp, amber spark | Workshops and trades: tool-brand blue with safety amber and a signal red. Blue sits in the brand only; the base is graphite, not navy. |

Rejected in the study:

- **Navy glass** (the previous default). Its base, backdrop and room ink were all navy, so it was a palette, not a
  material. Cobalt keeps the only useful part, a blue brand, on a graphite base.
- **Safety amber as a brand** (a workshop candidate). A 4.5:1 amber on white glass is brown, so the theme would lose
  its identity in light mode. Amber stays as Cobalt's second series colour, where an ochre light-mode value reads fine.
- **Brutalist, soft-pop and tangerine**. They were flat, non-glass presets. Tangerine's hue lives on in Ember, and
  soft-pop's violet is Tide's iris.

## Evaluation

`src/ds/styles/theme-audit.ts` parses tokens.css and every preset, resolves each theme and mode the way the cascade
does, and measures WCAG 2.2 contrast on the composited surface. The layers are the backdrop's lightest or darkest
stop, the overlay, the glass fill (`brightness()` for capsules, the sheen), and then the text. `theme-audit.test.ts`
makes this a gate in `npm test`. In each theme and mode:

- text 4.5:1: foreground, muted-foreground, salmon text and destructive text on cards; foreground and
  muted-foreground on capsules and popovers, also over the white room; primary-foreground on primary;
  brand-foreground on brand; background text on the brand, salmon and azure fills; the room ink and the plates;
- UI 3:1: brand and azure on cards; the four coloured table states on the room floor;
- the reduced-transparency surface;
- the four coloured table states at least 0.1 apart in OKLab.

Tuning the evaluation forced:

- dimming the brightest dark-mode blooms (Lime: overlay 30 % → 38 % and two blooms darker);
- dark muted-foreground at 66 % white (was 60 %);
- a lighter dark destructive (`0.8 0.14 22`);
- a denser dark chrome fill (80 %, was 72 %), so muted text on the rail holds over the white room.

Model limits:

- Overlapping blooms at full strength are not modelled; the 64 px blur makes them softer than the model assumes.
- `saturate()` is ignored because it keeps luminance.
- Out-of-gamut OKLCH is clipped.
- Free and blocked tables are neutral on purpose. They are told apart by their outline and hatch and by the legend
  label, so the gate does not check their fill contrast.

## Adding a theme

1. Copy a preset and keep the `label:` / `value:` header.
2. Set the primitives for both blocks.
3. Import the file in `src/app/globals.css` and run `npm run generate:presets`.
4. Run `npm test`. The audit lists every pair that misses AA.
