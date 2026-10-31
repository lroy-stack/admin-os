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
  - the seated table state per mode, and the four state fills of the dark room;
  - `--app-backdrop` and `--app-backdrop-overlay` per mode.
- **Light glass** uses translucent white fills (cards 58 %, capsules 42 %, chrome 80 % of the background) and
  `brightness(1.04)`. It has a white specular edge, a dark hairline and soft shadows tinted with the theme hue, and
  dark text.
- **Dark glass** keeps the original material: 5 % white cards, a 6 % white capsule fill, an 80 % chrome fill,
  `brightness(0.96)`, lit rims and white text.
- **Accent strength per mode.** Brand and series fills carry `text-background` (avatars, KPI badges). So in light mode
  the trio is ink-strength (about L 0.52–0.55) with near-white text, and in dark mode it is pastel with dark text.
- **Chart palette.** `--chart-1` is the brand, `--chart-2` is azure, and `--chart-3` to `--chart-5` are neutral steps of
  the foreground (62 %, 40 %, 24 %). Salmon is the alert role (late, at risk, losses, a falling KPI), so it is not a
  series colour. The Revenue chart, revenue by segment and lead sources read the chart tokens. Pipeline stage tones
  still use salmon for Negotiation: stages read cold to warm and Negotiation is the stage at risk of slipping.
- **Menus and popovers** are thick glass: `--popover-backdrop` (40 px blur, saturate 160 %) under a 94 % / 96 % fill,
  so the page behind never competes with their text. Reduced transparency drops the blur.
- **Chart axis labels.** Recharts 3 draws tick labels outside the group the chart primitive targets, so they kept the
  library's `#666` (2.5:1 on dark cards). `base.css` gives them the muted foreground.
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

## The room (floor plan)

The room is a flat plan where only the table state carries colour. The 3D scene reads its tokens
(`readRoomPalette`) and recolours without being re-created when the preset or the mode changes (`watchRoomPalette`
observes `data-theme-preset` and the `dark` class on `<html>`).

**Light mode** is a white room: paper `0.955`, floor `0.995`, walls `0.9`, chairs `0.84`. The arriving, leaving and late
states are the light brand trio, seated is the preset's deep tone, and plates are dark ink with white text. Free and
blocked tables are light neutrals (`0.65`, `0.63`) so they hold 3:1 on the white floor; before this change a free
table was white on white.

**Dark mode** is a dim room for night service, decided from these sources:

| Rule | Source | Value (OKLCH, `H` = `--tint-hue`) |
| --- | --- | --- |
| Dark surfaces are dark grey, never black, to avoid halation and eye strain. Raised surfaces get lighter: the base is `#121212` (OKLab L 0.18), 1dp is `#1E1E1E` (L 0.235), 8dp is `#2E2E2E` (L 0.30). | [Material Design 2, dark theme](https://m2.material.io/design/color/dark-theme.html); overlay formula `(4.5·ln(dp+1)+2) %` in [Flutter's ElevationOverlay](https://api.flutter.dev/flutter/material/ElevationOverlay/applyOverlay.html) | page background `0.152` < paper `0.25 0.01 H` < floor `0.30 0.012 H`; the gate holds the paper in L 0.23–0.31 |
| Current guidance uses tonal surfaces: dark surface tone 6 (L 0.19), containers tone 10/12/17/22 (L 0.22/0.24/0.28/0.33), text `on_surface` tone 90 (L 0.91). | Material 3, [`color_spec_2021.ts`](https://github.com/material-foundation/material-color-utilities/blob/main/typescript/dynamiccolor/color_spec_2021.ts) | the paper sits between tone 12 and 17, the floor near tone 17–22 |
| Text on dark surfaces is off-white, not `#fff`. M2 high-emphasis text is about 87 % white. | Material Design 2, dark theme; M3 `on_surface` tone 90 | room ink `0.93 0.012 H`; controls over the dark room read `--foreground` from it |
| Tables and controls over the room hold 3:1 against the floor or surface beside them. | [WCAG 2.2 SC 1.4.11 Non-text Contrast](https://www.w3.org/TR/WCAG22/#non-text-contrast) | every state, including free and blocked, ≥ 3:1 on the floor |
| Plate text, labels and control text hold 4.5:1. | [WCAG 2.2 SC 1.4.3 Contrast (Minimum)](https://www.w3.org/TR/WCAG22/#contrast-minimum) | plate `0.9 0.012 H` with text `0.2 0.02 H` |
| A table state never relies on colour alone. | [WCAG 2.2 SC 1.4.1 Use of Color](https://www.w3.org/TR/WCAG22/#use-of-color) | glyphs on the plates and in the legend (below) |

The M2 page renders client-side and could not be fetched as text. Its numbers were cross-checked against the overlay
formula in Flutter's implementation: 5 % white at 1dp gives `#1E1E1E`, and 12 % at 8dp gives `#2E2E2E`. Material 3
replaced the white overlays with tonal surfaces. Both band the raised surfaces at about L 0.22–0.33, and the paper
and floor fall inside both.

Dark room ladder: paper `0.25` < floor `0.30` (outdoor floor `0.31 0.03 150`) < landmarks `0.37` < chairs and wall
tops `0.42`, all tinted by `H`.

The four state fills sit at mid lightness (L 0.63–0.72) with 0.6–0.7× their light-mode chroma, so nothing glares. In
order arriving / seated / leaving / late:

| Theme | Dark-room states |
| --- | --- |
| Lime | `0.72 0.1 130` / `0.63 0.045 165` / `0.68 0.075 258` / `0.68 0.095 33` |
| Ember | `0.72 0.1 55` / `0.63 0.04 80` / `0.7 0.055 200` / `0.66 0.1 355` |
| Rose | `0.7 0.1 355` / `0.63 0.05 305` / `0.68 0.05 170` / `0.72 0.085 60` |
| Tide | `0.71 0.06 195` / `0.63 0.04 95` / `0.66 0.09 290` / `0.68 0.1 30` |
| Cobalt | `0.71 0.1 260` / `0.63 0.034 200` / `0.72 0.07 80` / `0.66 0.11 30` |

The other dark-room values:

- free tables `0.62 0.008 H`, blocked `0.58 0.006 H` with a dark hatch `0.2 0.01 H`;
- chairs stay neutral: they take 20 % of the state colour (`--room-chair-tint`; 65 % in light mode, as before);
- plates are light (`0.9`) with dark text and a dark rim, so they read 3:1 on the floor and against the pastel tables.

Non-colour cue per state (SC 1.4.1), from `state-cues.ts`:

| State | Cue |
| --- | --- |
| Free | Bare plate, the only one without a glyph; light neutral fill. |
| Arriving | Clock glyph. |
| Seated | People glyph. |
| Leaving | Exit glyph. |
| Late | Alarm-clock glyph and diagonal stripes. |
| Blocked | No-entry glyph and dots. |

On every state, the legend pairs each glyph with its label, and the callout and the plate's accessible name spell the
state out.

## Evaluation

`src/ds/styles/theme-audit.ts` parses tokens.css and every preset, resolves each theme and mode the way the cascade
does, and measures WCAG 2.2 contrast on the composited surface. The layers are the backdrop's lightest or darkest
stop, the overlay, the glass fill (`brightness()` for capsules, the sheen), and then the text. `theme-audit.test.ts`
makes this a gate in `npm test`. In each theme and mode:

- text 4.5:1 (SC 1.4.3) includes:
  - foreground, muted-foreground, chart axis labels, salmon text and destructive text on cards;
  - foreground and muted-foreground on capsules and popovers over the backdrop and over the room's lightest and
    darkest surface;
  - control text and its 70 % labels and glyphs on capsules over the room;
  - primary-foreground on primary, brand-foreground on brand, and background text on the brand, salmon and azure fills;
  - plate text, the detail chip, room ink and the 70 % landmark labels on the floor and paper;
- UI 3:1 (SC 1.4.11) includes:
  - brand, azure and chart series 1–3 on cards;
  - every table state (free and blocked too) on the floor;
  - the plate on the floor, and the plate rim on the plate;
  - in the dark room, the hatch on late and blocked tables;
- the reduced-transparency surface;
- the four coloured table states at least 0.1 apart in OKLab, in both modes;
- the dark room's sourced rules:
  - the Material band and ladder;
  - the off-white ink;
  - the mid-lightness, reduced-chroma state fills;
  - neutral chairs;
  - free tables at L 0.5–0.64.

Tuning the evaluation forced:

- dimming the brightest dark-mode blooms (Lime: overlay 30 % → 38 % and two blooms darker);
- dark muted-foreground at 66 % white (was 60 %);
- a lighter dark destructive (`0.8 0.14 22`);
- a denser dark chrome fill (80 %, was 72 %), so muted text on the rail holds over the white room;
- light free and blocked tables as light neutrals instead of white and near-white.

Model limits:

- Overlapping blooms at full strength are not modelled; the 64 px blur makes them softer than the model assumes.
- `saturate()` is ignored because it keeps luminance.
- Out-of-gamut OKLCH is clipped.
- Lighting is not modelled: three.js lights the top faces at about 1.1× the token and shade the walls' sides, so the
  gate measures the tokens (the 2D view and the legend).
- The light-mode hatch is a secondary cue and is not gated; the plate glyph carries SC 1.4.1 in both modes.

## Adding a theme

1. Copy a preset and keep the `label:` / `value:` header.
2. Set the primitives for both blocks.
3. Import the file in `src/app/globals.css` and run `npm run generate:presets`.
4. Run `npm test`. The audit lists every pair that misses AA.
