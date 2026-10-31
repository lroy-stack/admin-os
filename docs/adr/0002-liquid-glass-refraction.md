# ADR 0002 — Real refraction for the liquid-glass capsules with `@zakisheriff/liquid-glass`

Status: rejected after spike · Date: 2026-10-31 · Source reviewed: `Liquid-Glass-main` v0.3.13 (local copy), npm
`@zakisheriff/liquid-glass@0.3.13`

## Context

The shell already speaks a liquid-glass language built in CSS (`globals.css`): `liquid-glass`,
`liquid-glass-solid`, `liquid-glass-active`, `liquid-glass-brand`, and the sliding `LiquidThumb` of
`SegmentedControl` and the top nav. It frosts (blur, saturation, rims) but does not bend the backdrop.

`@zakisheriff/liquid-glass` (MIT, zero runtime dependencies, about 31 KB JS + 5.5 KB CSS gzipped) ships iOS
26-style glass for React: `GlassButton`, `GlassSwitch`, `GlassSlider`, `GlassSegmented`, `GlassNav`, `GlassMenu`,
`GlassInput`, `GlassCard`, `GlassSheet`, and the engine underneath (`useRefraction`, `usePress`, springs,
`setGlassQuality`).

What the code shows:

- **Rendering.** Chromium refracts the live backdrop through `backdrop-filter: url(#svg)` with `feDisplacementMap`
  maps computed once per size and cached (`src/engine/refraction.ts`).
- **Other browsers.** Safari and Firefox only refract "lenses", by mirroring the content underneath
  (`src/engine/mirror.ts`: `cloneNode` + `MutationObserver`); other surfaces fall back to frost and rims.
- **Accessibility.** Mirrors are `inert` and `aria-hidden`, with ids and tab stops stripped; motion and
  transparency preferences are respected.
- **Maturity.** Pre-1.0, single maintainer.

## Options

1. **Keep the CSS-only system.** Works everywhere, zero cost, no refraction.
2. **Replace our controls with the library's components.** That would lose Radix focus management, typeahead,
   portals and collision handling, duplicate components the repo already ships (`DropdownMenu`, vaul `Drawer`,
   `ToggleGroup`, `Switch`), and break the AGENTS.md rule to build on `src/components/ui/`. Rejected without a
   spike.
3. **Use only the engine as an enhancement layer on our own components.** `useRefraction` (lens kind) on
   `LiquidThumb`, behind one hook. Spiked below.

## Spike (option 3)

**Implementation.**

- `useLiquidLens(ref, enabled)` wrapped `useRefraction(ref, { kind: "lens", bezel: 10, thickness: 12, zoom: 1.04,
  dispersion: 0.5, strength: 0.9 }, enabled)`.
- `LiquidThumb` called it, enabled once the thumb was placed.
- `globals.css` applied `backdrop-filter: var(--lg-refraction) saturate(1.4)` on `.liquid-thumb[data-lg-refract]`,
  paused it under `html[data-lg-scrolling]`, and dropped it for `prefers-reduced-transparency`.
- Only the engine was imported; the package's `dist/index.mjs` does not pull in its CSS.

**Results** (production build served by `next start`, gzip sizes from Resource Timing, headless Chromium at
1440 × 900):

| Criterion | Limit | Result | Pass |
| --- | --- | --- | --- |
| JS on `/dashboard/default` | ≤ +15 KB gzip | 360.7 → 372.8 KB (+12.1 KB gzip, +34.8 KB raw, +1 file); CSS +0.1 KB | yes |
| Frame pacing while the thumb slides (12 moves, revenue card) | no dropped frames | p50 8.3 ms, p95 9.3 ms, max 9.4 ms, 0 frames over 20 ms (without refraction: p95 9.2 ms) | yes |
| Keyboard and screen reader | unchanged | Thumb stays `aria-hidden`; the engine's SVG defs root is `aria-hidden`; `ToggleGroup` untouched | yes |
| Reduced transparency | falls back to CSS | `backdrop-filter: none` on every thumb under emulated `prefers-reduced-transparency: reduce` | yes |
| **Visible effect** (pixel diff, refraction vs the same thumb without the map) | perceptible | Top-nav pill: 0.2 % of pixels change, max 11/255. Segmented thumb: mean 3.3/255, max 20/255. Imperceptible side by side | **no** |
| WebKit | — | Not measured here. By the library's design, Safari gets no backdrop refraction for this element | — |

**Why nothing shows.** Our thumb sits under the label, over a near-uniform frosted capsule, so the displacement
map has nothing with edges to bend. Raising the thumb above the label (a test with `z-index` only) bends the glyph
edges: max 96/255, mean 2.3/255. That is still subtle at a 32 px control. The iOS look in the library comes from
a different structure (`LensTrack`): a lens above the items that lifts and grows while pressed or dragged, and
draws from a live copy of the bar. Getting there means rebuilding `SegmentedControl` and the top nav on that
model, with the full effect only in Chromium.

## Decision

**Keep option 1 (CSS-only).** The spike passes on weight, frames, accessibility and fallback, but it costs 12 KB
gzip on every dashboard page for a change nobody can see. The code was reverted and the dependency removed.

**Revisit when** a design calls for a lifted, draggable lens (an iOS-style tab bar or segmented control that
grows under the finger). In that case, prototype one control on the library's `LensTrack` structure, measure the
same table, and include Safari.
