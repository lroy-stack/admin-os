import {
  DirectionalLight,
  Group,
  HemisphereLight,
  type Mesh,
  type Object3D,
  OrthographicCamera,
  PCFShadowMap,
  Plane,
  Raycaster,
  Scene,
  type Texture,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

import {
  type Box,
  CAMERA_ANIMATION_MS,
  type CameraAngles,
  cameraBasis,
  clamp,
  easeOutCubic,
  fitScale,
  focusScale,
  lerpAngle,
  ORBIT_PITCH_RANGE,
  VIEW_PRESETS,
  type ViewMode,
  ZOOM_RANGE,
} from "./camera-math";
import { type Level, levelBounds } from "./floor-model";
import { type RoomPalette, readRoomPalette, tableStateToken } from "./room-colors";
import {
  buildLandmark,
  buildTable,
  buildZoneFloor,
  buildZoneWalls,
  cm,
  disposeTree,
  type PickTag,
  patternTexture,
  TABLE_HEIGHT_M,
  type TableParts,
} from "./room-meshes";
import { tableStateCues } from "./state-cues";
import type { VisibleTableState } from "./table-state";

export type ScenePick = PickTag | { kind: "empty" };

function hatchTextures(palette: RoomPalette): Record<"stripes" | "dots", Texture> {
  const ink = palette["table-hatch"];
  return { stripes: patternTexture("stripes", ink), dots: patternTexture("dots", ink) };
}

export type SceneMode = "service" | "edit";

/** A drag that ended in edit mode: the element's new centre on the plan, in centimetres. */
export type SceneMove = PickTag & { xCm: number; yCm: number };

export type TableVisual = {
  id: string;
  state: VisibleTableState;
  selected: boolean;
  dimmed: boolean;
  candidate: boolean;
};

type CameraState = { targetX: number; targetZ: number; pitchDeg: number; yawDeg: number; scale: number };

const CAMERA_DISTANCE_M = 60;
const DRAG_THRESHOLD_PX = 6;
const ORBIT_YAW_PER_PX = -0.4;
const ORBIT_PITCH_PER_PX = 0.3;
const WHEEL_ZOOM_RATE = 0.0016;
const MAX_PIXEL_RATIO = 2;
const LEVEL_HEIGHT_M = 1.2;

/**
 * Imperative three.js engine for the room: one orthographic camera whose angles give the 2D, 2.5D and 3D views.
 * React owns the data; the engine owns the GPU, the camera and the pointer gestures, and reports picks back.
 */
export class FloorScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new OrthographicCamera();
  private readonly raycaster = new Raycaster();
  private readonly ground = new Plane(new Vector3(0, 1, 0), 0);
  private readonly levelGroup = new Group();
  private readonly tables = new Map<string, TableParts>();
  private readonly landmarks = new Map<string, Group>();
  private readonly tableBoxes = new Map<string, Box>();
  private palette: RoomPalette;
  private hatch: Record<"stripes" | "dots", Texture>;
  private readonly sky: HemisphereLight;
  private readonly sun: DirectionalLight;
  private readonly resizeObserver: ResizeObserver;
  private readonly visibilityObserver: IntersectionObserver;
  private readonly reducedMotion: MediaQueryList;

  private cameraState: CameraState = { targetX: 0, targetZ: 0, ...VIEW_PRESETS["2.5d"], scale: 40 };
  private fittedScale = 40;
  private levelBox: Box = { minX: 0, maxX: 1, minZ: 0, maxZ: 1, height: LEVEL_HEIGHT_M };
  private levelId: string | null = null;
  private level: Level | null = null;
  private visuals: readonly TableVisual[] = [];
  private view: ViewMode = "2.5d";
  private mode: SceneMode = "service";
  private elementDrag: { tag: PickTag; group: Group; offsetX: number; offsetZ: number; moved: boolean } | null = null;
  private animation: { from: CameraState; to: CameraState; start: number } | null = null;
  private frame = 0;
  private dirty = true;
  private visible = true;

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gesture: { startX: number; startY: number; dragging: boolean; orbit: boolean; pinchDistance: number } | null =
    null;

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: {
      onPick: (pick: ScenePick) => void;
      onMove: (move: SceneMove) => void;
      onFrame: () => void;
    },
  ) {
    this.palette = readRoomPalette(host);
    this.hatch = hatchTextures(this.palette);

    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFShadowMap;
    this.renderer.setClearColor(this.palette["room-paper"]);
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.style.touchAction = "none";
    this.renderer.domElement.style.display = "block";
    host.appendChild(this.renderer.domElement);

    this.sky = new HemisphereLight(0xffffff, this.palette["room-wall"], 2.2);
    this.scene.add(this.sky);
    this.sun = new DirectionalLight(0xffffff, 1.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.02;
    // Soft, light shadows: enough to read depth in 2.5D/3D without darkening the white room.
    this.sun.shadow.intensity = 0.45;
    this.scene.add(this.sun, this.sun.target, this.levelGroup);

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    // Pause the loop while the room is scrolled away or hidden behind another view.
    this.visibilityObserver = new IntersectionObserver((entries) => {
      const visible = entries.some((entry) => entry.isIntersecting);
      this.visible = visible;
      if (visible) this.requestRender();
    });
    this.visibilityObserver.observe(host);

    const canvas = this.renderer.domElement;
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    canvas.addEventListener("contextmenu", this.preventDefault);

    this.resize();
    this.loop();
  }

  /** Rebuilds the static room for a level and frames it. */
  setLevel(level: Level) {
    this.buildLevel(level);
    const newLevel = level.id !== this.levelId;
    this.levelId = level.id;
    const bounds = levelBounds(level);
    this.levelBox = {
      minX: cm(bounds.minX),
      maxX: cm(bounds.maxX),
      minZ: cm(bounds.minY),
      maxZ: cm(bounds.maxY),
      height: LEVEL_HEIGHT_M,
    };
    this.placeSun();
    // Editing rebuilds the level on every change; keep the camera where the editor left it until the level changes.
    if (this.mode === "service" || newLevel) this.fit(false);
    else this.requestRender();
  }

  /**
   * Recolours the room for a new theme or mode: rebuilds the meshes in the new palette and re-applies the table
   * states, keeping the renderer, the camera and the selection as they are.
   */
  setPalette(palette: RoomPalette) {
    this.palette = palette;
    this.hatch.stripes.dispose();
    this.hatch.dots.dispose();
    this.hatch = hatchTextures(palette);
    this.renderer.setClearColor(palette["room-paper"]);
    this.sky.groundColor.copy(palette["room-wall"]);
    if (this.level) this.buildLevel(this.level);
    this.setTableVisuals(this.visuals);
  }

  private buildLevel(level: Level) {
    this.level = level;
    disposeTree(this.levelGroup);
    this.levelGroup.clear();
    this.tables.clear();
    this.landmarks.clear();
    this.tableBoxes.clear();

    for (const zone of level.zones) {
      this.levelGroup.add(buildZoneFloor(zone, this.palette), buildZoneWalls(zone, this.palette));
      for (const table of zone.tables) {
        const parts = buildTable(table, this.palette);
        this.tables.set(table.id, parts);
        const reach = cm(Math.max(table.widthCm, table.depthCm)) / 2 + 0.5;
        this.tableBoxes.set(table.id, {
          minX: cm(table.xCm) - reach,
          maxX: cm(table.xCm) + reach,
          minZ: cm(table.yCm) - reach,
          maxZ: cm(table.yCm) + reach,
          height: TABLE_HEIGHT_M,
        });
        this.levelGroup.add(parts.group);
      }
    }
    for (const landmark of level.landmarks) {
      const group = buildLandmark(landmark, this.palette);
      this.landmarks.set(landmark.id, group);
      this.levelGroup.add(group);
    }
  }

  /** Edit mode lets tables and landmarks be dragged; service mode treats taps as selection. */
  setMode(mode: SceneMode) {
    this.mode = mode;
  }

  /** Live centre of an element in centimetres, including while it is being dragged. */
  positionOf(id: string) {
    const group = this.groupOf(id);
    return group ? { xCm: group.position.x * 100, yCm: group.position.z * 100 } : null;
  }

  private groupOf(id: string) {
    return this.tables.get(id)?.group ?? this.landmarks.get(id);
  }

  setTableVisuals(visuals: readonly TableVisual[]) {
    this.visuals = visuals;
    // The editor draws tables in service as grey footprints so they read on the white floor in 2D.
    const footprint = this.mode === "edit";
    for (const visual of visuals) {
      const parts = this.tables.get(visual.id);
      if (!parts) continue;
      const color =
        footprint && visual.state === "free" ? this.palette["room-chair"] : this.palette[tableStateToken[visual.state]];
      parts.top.color.copy(color);
      const pattern = tableStateCues[visual.state].pattern;
      parts.top.map = pattern ? this.hatch[pattern] : null;
      parts.top.needsUpdate = true;
      // Chairs take on a share of the state colour; the dark room keeps them close to neutral.
      parts.chairs.color
        .copy(this.palette["room-chair-wash"])
        .lerp(visual.state === "free" ? this.palette["room-chair"] : color, this.palette.chairTint);
      const opacity = visual.dimmed ? 0.3 : 1;
      parts.top.opacity = opacity;
      parts.chairs.opacity = opacity;
      parts.outline.visible = visual.selected;
      parts.candidate.visible = visual.candidate;
    }
    this.requestRender();
  }

  /** Switches camera angles and re-frames the whole level. */
  setView(view: ViewMode) {
    this.view = view;
    const angles = VIEW_PRESETS[view];
    const scale = fitScale(this.levelBox, angles, this.viewport());
    this.fittedScale = scale;
    this.animateTo({
      targetX: (this.levelBox.minX + this.levelBox.maxX) / 2,
      targetZ: (this.levelBox.minZ + this.levelBox.maxZ) / 2,
      ...angles,
      scale,
    });
  }

  getView() {
    return this.view;
  }

  fit(animate = true) {
    const angles: CameraAngles = { pitchDeg: this.cameraState.pitchDeg, yawDeg: this.cameraState.yawDeg };
    const scale = fitScale(this.levelBox, angles, this.viewport());
    this.fittedScale = scale;
    const goal: CameraState = {
      ...this.cameraState,
      targetX: (this.levelBox.minX + this.levelBox.maxX) / 2,
      targetZ: (this.levelBox.minZ + this.levelBox.maxZ) / 2,
      scale,
    };
    if (animate) this.animateTo(goal);
    else this.jumpTo(goal);
  }

  focusTable(tableId: string) {
    const box = this.tableBoxes.get(tableId);
    if (!box) return;
    const angles: CameraAngles = { pitchDeg: this.cameraState.pitchDeg, yawDeg: this.cameraState.yawDeg };
    this.animateTo({
      ...this.cameraState,
      targetX: (box.minX + box.maxX) / 2,
      targetZ: (box.minZ + box.maxZ) / 2,
      scale: focusScale(box, angles, this.viewport(), this.fittedScale),
    });
  }

  zoomBy(factor: number) {
    this.animateTo({ ...this.cameraState, scale: this.clampScale(this.cameraState.scale * factor) });
  }

  rotateQuarter() {
    this.animateTo({ ...this.cameraState, yawDeg: this.cameraState.yawDeg + 90 });
  }

  /** Screen position (px, relative to the host) of a plan point lifted `heightM` above the floor. */
  project(xCm: number, yCm: number, heightM = TABLE_HEIGHT_M) {
    const point = new Vector3(cm(xCm), heightM, cm(yCm)).project(this.camera);
    const { width, height } = this.viewport();
    return { x: ((point.x + 1) / 2) * width, y: ((1 - point.y) / 2) * height };
  }

  /** Pixels per metre; the label layer uses it to choose how much text fits on a plate. */
  getScale() {
    return this.cameraState.scale;
  }

  dispose() {
    // The loop schedules its next frame first, so cancelling it here always stops the loop.
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.visibilityObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerUp);
    canvas.removeEventListener("wheel", this.onWheel);
    canvas.removeEventListener("contextmenu", this.preventDefault);
    disposeTree(this.levelGroup);
    this.hatch.stripes.dispose();
    this.hatch.dots.dispose();
    this.sun.shadow.dispose();
    this.renderer.dispose();
    // dispose() keeps the WebGL context alive; browsers cap live contexts (~16), and the Floor view remounts.
    this.renderer.forceContextLoss();
    canvas.remove();
  }

  // ── camera ──────────────────────────────────────────────────────────────────────────────────────────────────

  private viewport() {
    return { width: Math.max(1, this.host.clientWidth), height: Math.max(1, this.host.clientHeight) };
  }

  private clampScale(scale: number) {
    return clamp(scale, this.fittedScale * ZOOM_RANGE.min, this.fittedScale * ZOOM_RANGE.max);
  }

  private applyCamera() {
    const { targetX, targetZ, pitchDeg, yawDeg, scale } = this.cameraState;
    const { toCamera, up } = cameraBasis({ pitchDeg, yawDeg });
    this.camera.position.set(
      targetX + toCamera.x * CAMERA_DISTANCE_M,
      toCamera.y * CAMERA_DISTANCE_M,
      targetZ + toCamera.z * CAMERA_DISTANCE_M,
    );
    this.camera.up.set(up.x, up.y, up.z);
    this.camera.lookAt(targetX, 0, targetZ);
    const { width, height } = this.viewport();
    this.camera.left = -width / 2 / scale;
    this.camera.right = width / 2 / scale;
    this.camera.top = height / 2 / scale;
    this.camera.bottom = -height / 2 / scale;
    this.camera.near = 0.1;
    this.camera.far = CAMERA_DISTANCE_M * 3;
    this.camera.updateProjectionMatrix();
    this.camera.updateMatrixWorld();
  }

  private jumpTo(state: CameraState) {
    this.animation = null;
    this.cameraState = state;
    this.applyCamera();
    this.requestRender();
  }

  private animateTo(state: CameraState) {
    if (this.reducedMotion.matches) {
      this.jumpTo(state);
      return;
    }
    this.animation = { from: { ...this.cameraState }, to: state, start: performance.now() };
    this.requestRender();
  }

  private stepAnimation(now: number) {
    if (!this.animation) return;
    const { from, to, start } = this.animation;
    const t = easeOutCubic((now - start) / CAMERA_ANIMATION_MS);
    this.cameraState = {
      targetX: from.targetX + (to.targetX - from.targetX) * t,
      targetZ: from.targetZ + (to.targetZ - from.targetZ) * t,
      pitchDeg: from.pitchDeg + (to.pitchDeg - from.pitchDeg) * t,
      yawDeg: lerpAngle(from.yawDeg, to.yawDeg, t),
      // Zoom feels linear when interpolated in log space.
      scale: Math.exp(Math.log(from.scale) + (Math.log(to.scale) - Math.log(from.scale)) * t),
    };
    if (t >= 1) this.animation = null;
    this.applyCamera();
  }

  private placeSun() {
    const { minX, maxX, minZ, maxZ } = this.levelBox;
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;
    const reach = Math.max(maxX - minX, maxZ - minZ) / 2 + 2;
    this.sun.position.set(centerX - reach * 0.6, 14, centerZ - reach * 0.8);
    this.sun.target.position.set(centerX, 0, centerZ);
    const shadowCamera = this.sun.shadow.camera;
    shadowCamera.left = -reach;
    shadowCamera.right = reach;
    shadowCamera.top = reach;
    shadowCamera.bottom = -reach;
    shadowCamera.updateProjectionMatrix();
  }

  private resize() {
    const { width, height } = this.viewport();
    this.renderer.setSize(width, height, false);
    this.renderer.domElement.style.width = `${width}px`;
    this.renderer.domElement.style.height = `${height}px`;
    const angles: CameraAngles = { pitchDeg: this.cameraState.pitchDeg, yawDeg: this.cameraState.yawDeg };
    const previousFit = this.fittedScale;
    this.fittedScale = fitScale(this.levelBox, angles, { width, height });
    this.cameraState = { ...this.cameraState, scale: (this.cameraState.scale / previousFit) * this.fittedScale };
    this.applyCamera();
    this.requestRender();
  }

  // ── render loop ─────────────────────────────────────────────────────────────────────────────────────────────

  private requestRender() {
    this.dirty = true;
  }

  private loop = () => {
    this.frame = requestAnimationFrame(this.loop);
    // biome-ignore lint/suspicious/noUnnecessaryConditions: requestRender(), the visibility observer and render reassign both flags; the rule infers them from their initial literal.
    if (!this.visible || (!this.dirty && !this.animation)) return;
    this.stepAnimation(performance.now());
    this.renderer.render(this.scene, this.camera);
    this.dirty = false;
    this.callbacks.onFrame();
  };

  // ── gestures ────────────────────────────────────────────────────────────────────────────────────────────────

  private preventDefault = (event: Event) => event.preventDefault();

  private toNdc(clientX: number, clientY: number) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    return new Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  }

  private groundPoint(clientX: number, clientY: number) {
    this.raycaster.setFromCamera(this.toNdc(clientX, clientY), this.camera);
    return this.raycaster.ray.intersectPlane(this.ground, new Vector3());
  }

  private pick(clientX: number, clientY: number): ScenePick {
    this.raycaster.setFromCamera(this.toNdc(clientX, clientY), this.camera);
    const hits = this.raycaster.intersectObjects(this.levelGroup.children, true);
    for (const hit of hits) {
      let node: Object3D | null = hit.object as Mesh;
      while (node) {
        const tag = node.userData.pick as PickTag | undefined;
        if (tag) return tag;
        node = node.parent;
      }
    }
    return { kind: "empty" };
  }

  private panBetween(fromX: number, fromY: number, toX: number, toY: number) {
    const from = this.groundPoint(fromX, fromY);
    const to = this.groundPoint(toX, toY);
    if (!from || !to) return;
    this.cameraState = {
      ...this.cameraState,
      targetX: this.cameraState.targetX + from.x - to.x,
      targetZ: this.cameraState.targetZ + from.z - to.z,
    };
  }

  private zoomAround(clientX: number, clientY: number, factor: number) {
    const before = this.groundPoint(clientX, clientY);
    this.cameraState = { ...this.cameraState, scale: this.clampScale(this.cameraState.scale * factor) };
    this.applyCamera();
    const after = this.groundPoint(clientX, clientY);
    if (before && after) {
      this.cameraState = {
        ...this.cameraState,
        targetX: this.cameraState.targetX + before.x - after.x,
        targetZ: this.cameraState.targetZ + before.z - after.z,
      };
    }
  }

  private onPointerDown = (event: PointerEvent) => {
    this.animation = null;
    this.renderer.domElement.setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.mode === "edit" && this.pointers.size === 1 && event.button === 0) {
      const tag = this.pick(event.clientX, event.clientY);
      const group = tag.kind === "empty" ? undefined : this.groupOf(tag.id);
      const point = this.groundPoint(event.clientX, event.clientY);
      if (tag.kind !== "empty" && group && point) {
        this.elementDrag = {
          tag,
          group,
          offsetX: group.position.x - point.x,
          offsetZ: group.position.z - point.z,
          moved: false,
        };
      }
    }
    const orbit = this.mode === "service" && this.view === "3d" && event.button === 0 && !event.shiftKey;
    const [first, second] = [...this.pointers.values()];
    this.gesture = {
      startX: event.clientX,
      startY: event.clientY,
      dragging: this.pointers.size > 1,
      orbit,
      pinchDistance: first && second ? Math.hypot(first.x - second.x, first.y - second.y) : 0,
    };
  };

  private onPointerMove = (event: PointerEvent) => {
    const previous = this.pointers.get(event.pointerId);
    if (!previous || !this.gesture) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size >= 2) {
      const [first, second] = [...this.pointers.values()];
      if (!first || !second) return;
      const distance = Math.hypot(first.x - second.x, first.y - second.y);
      if (this.gesture.pinchDistance > 0) {
        this.zoomAround((first.x + second.x) / 2, (first.y + second.y) / 2, distance / this.gesture.pinchDistance);
      }
      this.gesture.pinchDistance = distance;
      this.gesture.dragging = true;
    } else {
      const moved = Math.hypot(event.clientX - this.gesture.startX, event.clientY - this.gesture.startY);
      if (!this.gesture.dragging && moved < DRAG_THRESHOLD_PX) return;
      this.gesture.dragging = true;
      const drag = this.elementDrag;
      const point = drag ? this.groundPoint(event.clientX, event.clientY) : null;
      if (drag && point) {
        // Snap to the 10 cm editor grid while dragging so what you see is what gets saved.
        drag.group.position.x = Math.round((point.x + drag.offsetX) * 10) / 10;
        drag.group.position.z = Math.round((point.z + drag.offsetZ) * 10) / 10;
        drag.moved = true;
        this.requestRender();
        return;
      }
      if (this.gesture.orbit && event.buttons === 1) {
        this.cameraState = {
          ...this.cameraState,
          yawDeg: this.cameraState.yawDeg + (event.clientX - previous.x) * ORBIT_YAW_PER_PX,
          pitchDeg: clamp(
            this.cameraState.pitchDeg + (event.clientY - previous.y) * ORBIT_PITCH_PER_PX,
            ORBIT_PITCH_RANGE.minDeg,
            ORBIT_PITCH_RANGE.maxDeg,
          ),
        };
      } else {
        this.panBetween(previous.x, previous.y, event.clientX, event.clientY);
      }
    }
    this.applyCamera();
    this.requestRender();
  };

  private onPointerUp = (event: PointerEvent) => {
    const gesture = this.gesture;
    const drag = this.elementDrag;
    this.pointers.delete(event.pointerId);
    if (this.pointers.size === 0) {
      this.gesture = null;
      this.elementDrag = null;
    }
    if (drag?.moved) {
      this.callbacks.onMove({
        ...drag.tag,
        xCm: Math.round(drag.group.position.x * 100),
        yCm: Math.round(drag.group.position.z * 100),
      });
      return;
    }
    if (gesture && !gesture.dragging && event.type === "pointerup") {
      this.callbacks.onPick(this.pick(event.clientX, event.clientY));
    }
  };

  private onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.animation = null;
    const delta = clamp(event.deltaY, -240, 240) * (event.ctrlKey ? 0.35 : 1);
    this.zoomAround(event.clientX, event.clientY, Math.exp(-delta * WHEEL_ZOOM_RATE));
    this.applyCamera();
    this.requestRender();
  };
}
