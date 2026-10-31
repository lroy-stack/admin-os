/**
 * Editable, multi-level floor plan. All lengths are integer centimetres; the 3D scene converts to metres at its
 * boundary. A table's x/y is its centre. Chairs are derived from size and shape, never stored.
 */

export type TableShape = "rect" | "square" | "round" | "bar";

export type DiningTable = {
  id: string;
  label: string;
  shape: TableShape;
  xCm: number;
  yCm: number;
  widthCm: number;
  depthCm: number;
  rotationDeg: number;
  capacity: number;
  inService: boolean;
};

export type ZoneOutline = { xCm: number; yCm: number; widthCm: number; depthCm: number };

export type OpeningKind = "door" | "window";

export type WallEdge = "n" | "e" | "s" | "w";

/** A door or window cut into one edge of the zone outline. */
export type Opening = { id: string; kind: OpeningKind; edge: WallEdge; offsetCm: number; widthCm: number };

export type Zone = {
  id: string;
  name: string;
  outdoor: boolean;
  outline: ZoneOutline;
  wallHeightCm: number;
  openings: Opening[];
  tables: DiningTable[];
};

export type LandmarkKind = "bar" | "kitchen" | "restrooms" | "stairs" | "entrance" | "column" | "plant" | "label";

export type Landmark = {
  id: string;
  kind: LandmarkKind;
  label: string;
  xCm: number;
  yCm: number;
  widthCm: number;
  depthCm: number;
  rotationDeg: number;
  /** Stairs link to another level; tapping them switches level. */
  toLevelId?: string;
};

export type Level = {
  id: string;
  name: string;
  /** 0 is street level, negative numbers are basements. */
  index: number;
  zones: Zone[];
  landmarks: Landmark[];
};

export type FloorPlan = { id: string; name: string; levels: Level[] };

export type TableLocation = { table: DiningTable; zone: Zone; level: Level };

export function locateTables(plan: FloorPlan): TableLocation[] {
  return plan.levels.flatMap((level) =>
    level.zones.flatMap((zone) => zone.tables.map((table) => ({ table, zone, level }))),
  );
}

export function findTable(plan: FloorPlan, tableId: string): TableLocation | undefined {
  return locateTables(plan).find((location) => location.table.id === tableId);
}

export function totalSeats(plan: FloorPlan) {
  return locateTables(plan)
    .filter(({ table }) => table.inService)
    .reduce((total, { table }) => total + table.capacity, 0);
}

/** Levels ordered from the highest floor down, as a building section reads. */
export function levelsTopDown(plan: FloorPlan) {
  return [...plan.levels].sort((a, b) => b.index - a.index);
}

/** Axis-aligned bounds of a level in centimetres: zones plus landmarks. */
export function levelBounds(level: Level) {
  const boxes = [
    ...level.zones.map((zone) => zone.outline),
    ...level.landmarks.map((landmark) => ({
      xCm: landmark.xCm - landmark.widthCm / 2,
      yCm: landmark.yCm - landmark.depthCm / 2,
      widthCm: landmark.widthCm,
      depthCm: landmark.depthCm,
    })),
  ];
  if (boxes.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return {
    minX: Math.min(...boxes.map((box) => box.xCm)),
    minY: Math.min(...boxes.map((box) => box.yCm)),
    maxX: Math.max(...boxes.map((box) => box.xCm + box.widthCm)),
    maxY: Math.max(...boxes.map((box) => box.yCm + box.depthCm)),
  };
}
