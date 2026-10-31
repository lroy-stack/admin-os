import type {
  DiningTable,
  FloorPlan,
  Landmark,
  LandmarkKind,
  Level,
  TableShape,
  Zone,
  ZoneOutline,
} from "./floor-model";
import { locateTables } from "./floor-model";
import { defaultSize } from "./table-geometry";

/** Editor grid: positions and sizes snap to whole multiples of this many centimetres. */
export const SNAP_CM = 10;
export const ROTATION_STEP_DEG = 15;

export function snapCm(value: number, step = SNAP_CM) {
  return Math.round(value / step) * step;
}

export type PlanEdit =
  | { type: "moveTable"; tableId: string; xCm: number; yCm: number }
  | { type: "updateTable"; tableId: string; change: Partial<Omit<DiningTable, "id">> }
  | { type: "addTable"; zoneId: string; shape: TableShape; capacity: number }
  | { type: "duplicateTable"; tableId: string }
  | { type: "removeTable"; tableId: string }
  | { type: "rotateElement"; kind: "table" | "landmark"; id: string; byDeg: number }
  | { type: "moveLandmark"; landmarkId: string; xCm: number; yCm: number }
  | { type: "updateLandmark"; landmarkId: string; change: Partial<Omit<Landmark, "id">> }
  | { type: "addLandmark"; levelId: string; kind: LandmarkKind }
  | { type: "removeLandmark"; landmarkId: string }
  | { type: "addZone"; levelId: string }
  | { type: "updateZone"; zoneId: string; change: Partial<Omit<Zone, "id" | "tables" | "openings">> }
  | { type: "removeZone"; zoneId: string }
  | { type: "addLevel" }
  | { type: "renameLevel"; levelId: string; name: string }
  | { type: "removeLevel"; levelId: string };

const LANDMARK_DEFAULTS: Record<LandmarkKind, { label: string; widthCm: number; depthCm: number }> = {
  bar: { label: "Bar", widthCm: 300, depthCm: 70 },
  kitchen: { label: "Kitchen", widthCm: 240, depthCm: 160 },
  restrooms: { label: "Restrooms", widthCm: 220, depthCm: 160 },
  stairs: { label: "Stairs", widthCm: 160, depthCm: 220 },
  entrance: { label: "Entrance", widthCm: 160, depthCm: 60 },
  column: { label: "", widthCm: 40, depthCm: 40 },
  plant: { label: "", widthCm: 60, depthCm: 60 },
  label: { label: "Label", widthCm: 120, depthCm: 40 },
};

const mapLevels = (plan: FloorPlan, update: (level: Level) => Level): FloorPlan => ({
  ...plan,
  levels: plan.levels.map(update),
});

const mapZones = (plan: FloorPlan, update: (zone: Zone) => Zone): FloorPlan =>
  mapLevels(plan, (level) => ({ ...level, zones: level.zones.map(update) }));

const mapTables = (plan: FloorPlan, update: (table: DiningTable) => DiningTable): FloorPlan =>
  mapZones(plan, (zone) => ({ ...zone, tables: zone.tables.map(update) }));

const mapLandmarks = (plan: FloorPlan, update: (landmark: Landmark) => Landmark): FloorPlan =>
  mapLevels(plan, (level) => ({ ...level, landmarks: level.landmarks.map(update) }));

/** Next free label with the zone's prefix: S1…S8 → S9. */
export function nextTableLabel(plan: FloorPlan, prefix: string) {
  const used = new Set(locateTables(plan).map(({ table }) => table.label));
  let index = 1;
  while (used.has(`${prefix}${index}`)) index += 1;
  return `${prefix}${index}`;
}

function zonePrefix(zone: Zone) {
  return (zone.tables[0]?.label.match(/^[A-Za-z]+/)?.[0] ?? zone.name.charAt(0)).toUpperCase();
}

function uniqueId(prefix: string, taken: ReadonlySet<string>) {
  let index = 1;
  while (taken.has(`${prefix}-${index}`)) index += 1;
  return `${prefix}-${index}`;
}

function allIds(plan: FloorPlan) {
  return new Set(
    plan.levels.flatMap((level) => [
      level.id,
      ...level.landmarks.map((landmark) => landmark.id),
      ...level.zones.flatMap((zone) => [zone.id, ...zone.tables.map((table) => table.id)]),
    ]),
  );
}

function centreOf(outline: ZoneOutline) {
  return { xCm: snapCm(outline.xCm + outline.widthCm / 2), yCm: snapCm(outline.yCm + outline.depthCm / 2) };
}

/** Applies one edit and returns a new plan; the input plan is never mutated. */
export function applyEdit(plan: FloorPlan, edit: PlanEdit): FloorPlan {
  switch (edit.type) {
    case "moveTable":
      return mapTables(plan, (table) =>
        table.id === edit.tableId ? { ...table, xCm: snapCm(edit.xCm), yCm: snapCm(edit.yCm) } : table,
      );
    case "updateTable":
      return mapTables(plan, (table) => (table.id === edit.tableId ? { ...table, ...edit.change } : table));
    case "addTable":
      return mapZones(plan, (zone) => {
        if (zone.id !== edit.zoneId) return zone;
        const label = nextTableLabel(plan, zonePrefix(zone));
        // Ids never derive from labels: labels are renamed and reused, ids must stay unique.
        const table: DiningTable = {
          id: crypto.randomUUID(),
          label,
          shape: edit.shape,
          capacity: edit.capacity,
          rotationDeg: 0,
          inService: true,
          ...centreOf(zone.outline),
          ...defaultSize(edit.capacity, edit.shape),
        };
        return { ...zone, tables: [...zone.tables, table] };
      });
    case "duplicateTable":
      return mapZones(plan, (zone) => {
        const original = zone.tables.find((table) => table.id === edit.tableId);
        if (!original) return zone;
        const label = nextTableLabel(plan, zonePrefix(zone));
        const copy = {
          ...original,
          id: crypto.randomUUID(),
          label,
          xCm: snapCm(original.xCm + original.widthCm / 2 + 60),
        };
        return { ...zone, tables: [...zone.tables, copy] };
      });
    case "rotateElement":
      return edit.kind === "table"
        ? mapTables(plan, (table) =>
            table.id === edit.id ? { ...table, rotationDeg: table.rotationDeg + edit.byDeg } : table,
          )
        : mapLandmarks(plan, (landmark) =>
            landmark.id === edit.id ? { ...landmark, rotationDeg: landmark.rotationDeg + edit.byDeg } : landmark,
          );
    case "removeTable":
      return mapZones(plan, (zone) => ({ ...zone, tables: zone.tables.filter((table) => table.id !== edit.tableId) }));
    case "moveLandmark":
      return mapLandmarks(plan, (landmark) =>
        landmark.id === edit.landmarkId ? { ...landmark, xCm: snapCm(edit.xCm), yCm: snapCm(edit.yCm) } : landmark,
      );
    case "updateLandmark":
      return mapLandmarks(plan, (landmark) =>
        landmark.id === edit.landmarkId ? { ...landmark, ...edit.change } : landmark,
      );
    case "addLandmark":
      return mapLevels(plan, (level) => {
        if (level.id !== edit.levelId) return level;
        const anchor = level.zones[0] ? centreOf(level.zones[0].outline) : { xCm: 0, yCm: 0 };
        const landmark: Landmark = {
          id: uniqueId(edit.kind, allIds(plan)),
          kind: edit.kind,
          rotationDeg: 0,
          ...anchor,
          ...LANDMARK_DEFAULTS[edit.kind],
        };
        return { ...level, landmarks: [...level.landmarks, landmark] };
      });
    case "removeLandmark":
      return mapLevels(plan, (level) => ({
        ...level,
        landmarks: level.landmarks.filter((landmark) => landmark.id !== edit.landmarkId),
      }));
    case "addZone":
      return mapLevels(plan, (level) => {
        if (level.id !== edit.levelId) return level;
        const right = Math.max(0, ...level.zones.map((zone) => zone.outline.xCm + zone.outline.widthCm));
        const zone: Zone = {
          id: uniqueId("zone", allIds(plan)),
          name: `Zone ${level.zones.length + 1}`,
          outdoor: false,
          outline: { xCm: right + 100, yCm: 0, widthCm: 600, depthCm: 500 },
          wallHeightCm: 120,
          openings: [],
          tables: [],
        };
        return { ...level, zones: [...level.zones, zone] };
      });
    case "updateZone":
      return mapZones(plan, (zone) => (zone.id === edit.zoneId ? { ...zone, ...edit.change } : zone));
    case "removeZone":
      return mapLevels(plan, (level) => ({ ...level, zones: level.zones.filter((zone) => zone.id !== edit.zoneId) }));
    case "addLevel": {
      const index = Math.max(0, ...plan.levels.map((level) => level.index)) + 1;
      const level: Level = {
        id: uniqueId("level", allIds(plan)),
        name: `Level ${index}`,
        index,
        zones: [],
        landmarks: [],
      };
      return { ...plan, levels: [...plan.levels, level] };
    }
    case "renameLevel":
      return mapLevels(plan, (level) => (level.id === edit.levelId ? { ...level, name: edit.name } : level));
    case "removeLevel":
      // A level can only go once it is empty, so no table or landmark disappears by accident.
      return {
        ...plan,
        levels: plan.levels.filter(
          (level) => level.id !== edit.levelId || level.zones.length > 0 || level.landmarks.length > 0,
        ),
      };
    default: {
      const unreachable: never = edit;
      return unreachable;
    }
  }
}

export type PlanIssue = { elementId: string; message: string };

const footprintRadius = (table: DiningTable) => Math.max(table.widthCm, table.depthCm) / 2;

/** Flags tables that overlap another table or sit outside their zone; nothing is blocked, only reported. */
export function findPlanIssues(plan: FloorPlan): PlanIssue[] {
  const located = locateTables(plan);
  const outside = located
    .filter(({ table, zone }) => {
      const { xCm, yCm, widthCm, depthCm } = zone.outline;
      return table.xCm < xCm || table.xCm > xCm + widthCm || table.yCm < yCm || table.yCm > yCm + depthCm;
    })
    .map(({ table, zone }) => ({ elementId: table.id, message: `${table.label} is outside ${zone.name}` }));

  const overlapping = located.flatMap(({ table, level }, index) =>
    located
      .slice(index + 1)
      .filter(
        (other) =>
          other.level.id === level.id &&
          Math.hypot(other.table.xCm - table.xCm, other.table.yCm - table.yCm) <
            footprintRadius(table) + footprintRadius(other.table),
      )
      .map((other) => ({ elementId: table.id, message: `${table.label} overlaps ${other.table.label}` })),
  );

  return [...outside, ...overlapping];
}
