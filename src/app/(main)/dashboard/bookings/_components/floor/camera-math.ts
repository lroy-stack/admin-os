/**
 * Pure camera maths for the orthographic room view (no three.js import, so it is unit-testable).
 * World axes: x east, y up, z south; one unit is one metre. Plan y (cm) maps to world z.
 */

export type ViewMode = "2d" | "2.5d" | "3d";

export type CameraAngles = { pitchDeg: number; yawDeg: number };

/** Camera presets: 2D top-down, 2.5D tilted, 3D low orbit. */
export const VIEW_PRESETS: Record<ViewMode, CameraAngles> = {
  "2d": { pitchDeg: 90, yawDeg: 0 },
  "2.5d": { pitchDeg: 52, yawDeg: 38 },
  "3d": { pitchDeg: 38, yawDeg: 35 },
};

export const ORBIT_PITCH_RANGE = { minDeg: 18, maxDeg: 80 } as const;
/** Zoom limits relative to the zoom that fits the whole level. */
export const ZOOM_RANGE = { min: 0.7, max: 7 } as const;
export const ZOOM_BUTTON_STEP = 1.35;
export const CAMERA_ANIMATION_MS = 280;
export const FIT_MARGIN_M = 0.6;
/** A focused table fills about this share of the viewport, capped relative to the fitted zoom. */
export const FOCUS = { widthShare: 0.3, heightShare: 0.34, maxFactor: 2.3 } as const;

type Vec3 = { x: number; y: number; z: number };

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});

/**
 * Camera basis for given angles. `toCamera` points from the target to the camera; `right` and `up` span the screen.
 * At yaw 0 the camera sits south of the target so north reads up; the basis stays valid looking straight down.
 */
export function cameraBasis({ pitchDeg, yawDeg }: CameraAngles) {
  const pitch = radians(pitchDeg);
  const yaw = radians(yawDeg);
  const toCamera: Vec3 = { x: Math.cos(pitch) * Math.sin(yaw), y: Math.sin(pitch), z: Math.cos(pitch) * Math.cos(yaw) };
  const right: Vec3 = { x: Math.cos(yaw), y: 0, z: -Math.sin(yaw) };
  const forward: Vec3 = { x: -toCamera.x, y: -toCamera.y, z: -toCamera.z };
  const up = cross(right, forward);
  return { toCamera, right, up };
}

export type Box = { minX: number; maxX: number; minZ: number; maxZ: number; height: number };

/** Width and height (metres) that a box occupies on screen for the given angles. */
export function projectedSize(box: Box, angles: CameraAngles) {
  const { right, up } = cameraBasis(angles);
  const corners: Vec3[] = [];
  for (const x of [box.minX, box.maxX]) {
    for (const z of [box.minZ, box.maxZ]) {
      for (const y of [0, box.height]) corners.push({ x, y, z });
    }
  }
  const xs = corners.map((corner) => dot(corner, right));
  const ys = corners.map((corner) => dot(corner, up));
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}

export type Viewport = { width: number; height: number };

/** Pixels per metre that fit `box` inside the viewport with a margin. */
export function fitScale(box: Box, angles: CameraAngles, viewport: Viewport, marginM = FIT_MARGIN_M) {
  const size = projectedSize(box, angles);
  return Math.min(viewport.width / (size.width + marginM * 2), viewport.height / (size.height + marginM * 2));
}

/** Pixels per metre that frame one table: it fills a share of the viewport, never closer than the cap. */
export function focusScale(table: Box, angles: CameraAngles, viewport: Viewport, fittedScale: number) {
  const size = projectedSize(table, angles);
  const wanted = Math.min(
    (viewport.width * FOCUS.widthShare) / Math.max(size.width, 0.01),
    (viewport.height * FOCUS.heightShare) / Math.max(size.height, 0.01),
  );
  return clamp(wanted, fittedScale, fittedScale * FOCUS.maxFactor);
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function easeOutCubic(progress: number) {
  const t = clamp(progress, 0, 1);
  return 1 - (1 - t) ** 3;
}

/** Shortest-path interpolation for yaw so a 350° → 10° change turns 20°, not 340°. */
export function lerpAngle(from: number, to: number, t: number) {
  const delta = ((((to - from) % 360) + 540) % 360) - 180;
  return from + delta * t;
}
