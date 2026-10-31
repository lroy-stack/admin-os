# ADR 0001 — Render the floor plan with one three.js scene and an orthographic camera

Status: accepted · Date: 2026-10-31

## Context

The Reservations room must offer 2D, 2.5D and 3D views with animated camera focus, picking, an editor and several
levels, on desktop, tablet and phone. The repo has no 2D/3D rendering dependency today. Production consoles for
restaurants and similar venues already ship this capability with the same engine, so we reuse that proven approach
instead of designing a new one.

## Options considered

1. **SVG / HTML with CSS 3D transforms.** No dependency, but 3D is a skewed plane: no real extrusion, shadows,
   orbit or occlusion; picking and label projection get fragile as soon as the camera rotates.
2. **react-three-fiber + drei.** Idiomatic React and convenient camera helpers, but two extra runtime dependencies
   on top of three, a second reconciler to keep compatible with React 19 / Next 16 and the React Compiler, and no
   proven code to reuse.
3. **Plain `three` behind a small React wrapper (chosen).** The engine and structure of the proven approach: one
   `WebGLRenderer`, one `OrthographicCamera`, the three views as camera presets (2D pitch 90°, 2.5D 52°/38°,
   3D 38°/35° with orbit), raycast picking, DOM labels projected per frame, render loop paused when off-screen.

## Decision

Option 3. Add `three` (`^0.185`) and `@types/three`. The scene lives in
`src/app/(main)/dashboard/bookings/_components/floor/` until another screen needs it, behind one client component
loaded with `next/dynamic` (`ssr: false`) so three ships only when the Floor view opens. All geometry, state and
rail logic stays in pure modules that do not import three.

## Consequences

- Bundle: three loads lazily for the Floor view only. Measured at build: 555 KB raw / 139 KB gzip for the chunk
  that holds three and the scene; no other route pays for it.
- Styling: the scene reads colours from the CSS tokens at runtime, so the room follows the theme in one place.
- Accessibility: the canvas is `aria-hidden`; table plates are labelled buttons, and the rail, list and agenda carry
  keyboard and screen-reader access.
- Testing: pure modules (table state, covers sizing, rail planner, camera maths) get unit tests; this adds
  `vitest` as a dev dependency because the repo has no test runner.
- Reversibility: the wrapper boundary (props in, events out) allows swapping the engine for r3f later without
  touching the screen.
- Full view must not remount the canvas (it would recreate the WebGL context and lose the camera), so it is a
  fixed layer around the same tree rather than a portal, and the room never leaves its parent.
