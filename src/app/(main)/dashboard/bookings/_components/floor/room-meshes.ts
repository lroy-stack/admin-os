import {
  BoxGeometry,
  CanvasTexture,
  type Color,
  CylinderGeometry,
  Group,
  type Material,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  SphereGeometry,
  type Texture,
} from "three";

import type { DiningTable, Landmark, Opening, WallEdge, Zone } from "./floor-model";
import type { RoomPalette } from "./room-colors";
import { seatPlacements } from "./table-geometry";

/** Centimetres to world metres. Plan y (south is positive) maps to world z. */
export const cm = (value: number) => value / 100;

export const TABLE_HEIGHT_M = 0.75;
const SLAB_DEPTH_M = 0.08;
const WALL_THICKNESS_M = 0.12;
const WINDOW_SILL_M = 0.45;

export type PickTag = { kind: "table" | "landmark"; id: string };

export type TableParts = {
  group: Group;
  top: MeshStandardMaterial;
  chairs: MeshStandardMaterial;
  outline: Mesh;
  candidate: Mesh;
};

const matte = (color: Color, options: { transparent?: boolean; opacity?: number } = {}) =>
  new MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...options });

function shadowed<T extends Mesh>(mesh: T, cast = true): T {
  mesh.castShadow = cast;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Repeating diagonal stripes or dots, used as a second, colour-independent channel for late and blocked tables.
 * The texture multiplies the table colour: white leaves it untouched, `ink` (the `--table-hatch` token) darkens it.
 */
export function patternTexture(kind: "stripes" | "dots", ink: Color): Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Pattern textures need a 2D canvas context");
  context.fillStyle = "white";
  context.fillRect(0, 0, size, size);
  context.fillStyle = `#${ink.getHexString()}`;
  if (kind === "stripes") {
    context.beginPath();
    for (let offset = -size; offset < size * 2; offset += 16) {
      context.moveTo(offset, 0);
      context.lineTo(offset + 6, 0);
      context.lineTo(offset + 6 - size, size);
      context.lineTo(offset - size, size);
    }
    context.fill();
  } else {
    for (const [x, y] of [
      [16, 16],
      [48, 48],
    ]) {
      context.beginPath();
      context.arc(x ?? 0, y ?? 0, 5, 0, Math.PI * 2);
      context.fill();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function buildZoneFloor(zone: Zone, palette: RoomPalette) {
  const { xCm, yCm, widthCm, depthCm } = zone.outline;
  const slab = shadowed(
    new Mesh(
      new BoxGeometry(cm(widthCm), SLAB_DEPTH_M, cm(depthCm)),
      matte(zone.outdoor ? palette["room-floor-outdoor"] : palette["room-floor"]),
    ),
    false,
  );
  slab.position.set(cm(xCm + widthCm / 2), -SLAB_DEPTH_M / 2, cm(yCm + depthCm / 2));
  return slab;
}

type EdgeGeometry = { length: number; start: [number, number]; direction: [number, number] };

function edgeGeometry(zone: Zone, edge: WallEdge): EdgeGeometry {
  const { xCm, yCm, widthCm, depthCm } = zone.outline;
  switch (edge) {
    case "n":
      return { length: widthCm, start: [xCm, yCm], direction: [1, 0] };
    case "s":
      return { length: widthCm, start: [xCm, yCm + depthCm], direction: [1, 0] };
    case "w":
      return { length: depthCm, start: [xCm, yCm], direction: [0, 1] };
    case "e":
      return { length: depthCm, start: [xCm + widthCm, yCm], direction: [0, 1] };
    default: {
      const unreachable: never = edge;
      return unreachable;
    }
  }
}

/** Walls along the zone outline; doors leave a gap, windows leave a low sill. Outdoor zones get a low railing. */
export function buildZoneWalls(zone: Zone, palette: RoomPalette) {
  const group = new Group();
  const wallHeight = cm(zone.wallHeightCm);
  const material = zone.outdoor
    ? matte(palette["room-wall"], { transparent: true, opacity: 0.55 })
    : matte(palette["room-wall"]);

  const addSegment = (geometry: EdgeGeometry, fromCm: number, toCm: number, height: number) => {
    const length = toCm - fromCm;
    if (length <= 1 || height <= 0) return;
    const [startX, startY] = geometry.start;
    const [dirX, dirY] = geometry.direction;
    const mid = fromCm + length / 2;
    const wall = shadowed(
      new Mesh(
        new BoxGeometry(dirX ? cm(length) : WALL_THICKNESS_M, height, dirY ? cm(length) : WALL_THICKNESS_M),
        material,
      ),
    );
    wall.position.set(cm(startX + dirX * mid), height / 2, cm(startY + dirY * mid));
    group.add(wall);
  };

  for (const edge of ["n", "e", "s", "w"] as const) {
    const geometry = edgeGeometry(zone, edge);
    const openings = zone.openings
      .filter((opening: Opening) => opening.edge === edge)
      .sort((a, b) => a.offsetCm - b.offsetCm);
    let cursor = 0;
    for (const opening of openings) {
      addSegment(geometry, cursor, opening.offsetCm, wallHeight);
      if (opening.kind === "window") {
        addSegment(geometry, opening.offsetCm, opening.offsetCm + opening.widthCm, Math.min(WINDOW_SILL_M, wallHeight));
      }
      cursor = opening.offsetCm + opening.widthCm;
    }
    addSegment(geometry, cursor, geometry.length, wallHeight);
  }
  return group;
}

export function buildTable(table: DiningTable, palette: RoomPalette): TableParts {
  const group = new Group();
  group.position.set(cm(table.xCm), 0, cm(table.yCm));
  group.rotation.y = (-table.rotationDeg * Math.PI) / 180;
  group.userData.pick = { kind: "table", id: table.id } satisfies PickTag;

  const top = matte(palette["table-free"], { transparent: true });
  const chairs = matte(palette["room-chair"], { transparent: true });
  const width = cm(table.widthCm);
  const depth = cm(table.depthCm);
  const round = table.shape === "round";

  const topGeometry = round
    ? new CylinderGeometry(width / 2, width / 2, 0.05, 40)
    : new BoxGeometry(width, 0.05, depth);
  const topMesh = shadowed(new Mesh(topGeometry, top));
  topMesh.position.y = TABLE_HEIGHT_M;
  group.add(topMesh);

  const pedestal = shadowed(new Mesh(new CylinderGeometry(0.05, 0.16, TABLE_HEIGHT_M, 16), chairs));
  pedestal.position.y = TABLE_HEIGHT_M / 2;
  group.add(pedestal);

  for (const seat of seatPlacements(table)) {
    const chair = new Group();
    chair.position.set(cm(seat.xCm), 0, cm(seat.yCm));
    chair.rotation.y = (-seat.rotationDeg * Math.PI) / 180;
    const seatMesh = shadowed(new Mesh(new BoxGeometry(0.42, 0.06, 0.42), chairs));
    seatMesh.position.y = 0.45;
    const back = shadowed(new Mesh(new BoxGeometry(0.42, 0.4, 0.05), chairs));
    back.position.set(0, 0.68, 0.19);
    chair.add(seatMesh, back);
    group.add(chair);
  }

  // Thick ink outline shown under the top when the table is selected.
  const outlineGeometry = round
    ? new CylinderGeometry(width / 2 + 0.08, width / 2 + 0.08, 0.04, 40)
    : new BoxGeometry(width + 0.16, 0.04, depth + 0.16);
  const outline = new Mesh(outlineGeometry, matte(palette["room-ink"]));
  outline.position.y = TABLE_HEIGHT_M - 0.03;
  outline.visible = false;
  group.add(outline);

  // Accent halo on the floor for tables that can take the party being seated.
  const haloGeometry = round
    ? new CylinderGeometry(width / 2 + 0.55, width / 2 + 0.55, 0.01, 40)
    : new BoxGeometry(width + 1.1, 0.01, depth + 1.1);
  const candidate = new Mesh(haloGeometry, matte(palette["table-arriving"], { transparent: true, opacity: 0.55 }));
  candidate.position.y = 0.005;
  candidate.visible = false;
  group.add(candidate);

  return { group, top, chairs, outline, candidate };
}

const LANDMARK_HEIGHT_M: Record<Landmark["kind"], number> = {
  bar: 1.05,
  kitchen: 1.2,
  restrooms: 1.2,
  stairs: 0.9,
  entrance: 0.02,
  column: 1.8,
  plant: 0.9,
  label: 0,
};

export function buildLandmark(landmark: Landmark, palette: RoomPalette) {
  const group = new Group();
  group.position.set(cm(landmark.xCm), 0, cm(landmark.yCm));
  group.rotation.y = (-landmark.rotationDeg * Math.PI) / 180;
  group.userData.pick = { kind: "landmark", id: landmark.id } satisfies PickTag;
  const width = cm(landmark.widthCm);
  const depth = cm(landmark.depthCm);
  const height = LANDMARK_HEIGHT_M[landmark.kind];
  const surface = matte(landmark.kind === "entrance" ? palette["room-wall"] : palette["room-landmark"]);

  switch (landmark.kind) {
    case "stairs": {
      const steps = 6;
      for (let step = 0; step < steps; step += 1) {
        const stepHeight = (height / steps) * (step + 1);
        const stepMesh = shadowed(new Mesh(new BoxGeometry(width, stepHeight, depth / steps), surface));
        stepMesh.position.set(0, stepHeight / 2, -depth / 2 + (depth / steps) * (step + 0.5));
        group.add(stepMesh);
      }
      break;
    }
    case "plant": {
      const pot = shadowed(new Mesh(new CylinderGeometry(width * 0.32, width * 0.26, 0.4, 20), surface));
      pot.position.y = 0.2;
      const leaves = shadowed(new Mesh(new SphereGeometry(width * 0.5, 20, 14), matte(palette["room-plant"])));
      leaves.position.y = 0.4 + width * 0.4;
      group.add(pot, leaves);
      break;
    }
    case "column": {
      const column = shadowed(new Mesh(new BoxGeometry(width, height, depth), surface));
      column.position.y = height / 2;
      group.add(column);
      break;
    }
    case "label":
      break;
    case "bar":
    case "kitchen":
    case "restrooms":
    case "entrance": {
      const block = shadowed(new Mesh(new BoxGeometry(width, height, depth), surface), landmark.kind !== "entrance");
      block.position.y = height / 2;
      group.add(block);
      break;
    }
    default: {
      const unreachable: never = landmark.kind;
      return unreachable;
    }
  }
  return group;
}

/** Releases GPU memory for every mesh under `root`. */
export function disposeTree(root: Group) {
  const materials = new Set<Material>();
  root.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) materials.add(material);
    }
  });
  for (const material of materials) material.dispose();
}
