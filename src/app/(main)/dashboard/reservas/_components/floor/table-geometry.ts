import type { DiningTable, TableShape } from "./floor-model";

/**
 * Seating rules (centimetres): 60 cm per cover, a 70 cm minimum side and 90 cm rectangle depth, the usual
 * restaurant planning defaults.
 */
export const LAYOUT_RULES = {
  coverPitchCm: 60,
  minTableSideCm: 70,
  rectDepthCm: 90,
  roundAllowanceCm: 20,
  seatDepthCm: 45,
  seatWidthCm: 45,
  seatClearanceCm: 12,
  sizeStepCm: 10,
} as const;

const roundUpToStep = (value: number) => Math.ceil(value / LAYOUT_RULES.sizeStepCm) * LAYOUT_RULES.sizeStepCm;

/** Default footprint for a table that seats `capacity` guests. */
export function defaultSize(capacity: number, shape: TableShape): { widthCm: number; depthCm: number } {
  const { coverPitchCm, minTableSideCm, rectDepthCm, roundAllowanceCm } = LAYOUT_RULES;
  switch (shape) {
    case "round": {
      const circumference = capacity * coverPitchCm;
      const diameter = Math.max(minTableSideCm, roundUpToStep(circumference / Math.PI + roundAllowanceCm));
      return { widthCm: diameter, depthCm: diameter };
    }
    case "square": {
      const side = Math.max(minTableSideCm, roundUpToStep((capacity / 4) * coverPitchCm + 20));
      return { widthCm: side, depthCm: side };
    }
    case "bar":
      return { widthCm: Math.max(minTableSideCm, roundUpToStep(capacity * coverPitchCm)), depthCm: 60 };
    case "rect":
      return {
        widthCm: Math.max(minTableSideCm, roundUpToStep(Math.ceil(capacity / 2) * coverPitchCm)),
        depthCm: rectDepthCm,
      };
    default: {
      const unreachable: never = shape;
      return unreachable;
    }
  }
}

export type SeatPlacement = { xCm: number; yCm: number; rotationDeg: number };

/** Evenly spread `count` positions along a side of `length`. */
function spread(count: number, length: number) {
  return Array.from({ length: count }, (_, index) => -length / 2 + (length / count) * (index + 0.5));
}

/**
 * Chair positions relative to the table centre (before the table's own rotation). Rectangles seat on the long
 * sides, squares on four sides, rounds on a circle, bars on one side.
 */
export function seatPlacements(
  table: Pick<DiningTable, "shape" | "capacity" | "widthCm" | "depthCm">,
): SeatPlacement[] {
  const offset = LAYOUT_RULES.seatClearanceCm + LAYOUT_RULES.seatDepthCm / 2;
  const { capacity, widthCm, depthCm } = table;
  switch (table.shape) {
    case "round":
      return Array.from({ length: capacity }, (_, index) => {
        const angle = (index / capacity) * Math.PI * 2;
        const radius = widthCm / 2 + offset;
        return {
          xCm: Math.cos(angle) * radius,
          yCm: Math.sin(angle) * radius,
          rotationDeg: (angle * 180) / Math.PI + 90,
        };
      });
    case "bar":
      return spread(capacity, widthCm).map((x) => ({ xCm: x, yCm: depthCm / 2 + offset, rotationDeg: 0 }));
    case "square": {
      const perSide = [0, 1, 2, 3].map((side) => Math.floor(capacity / 4) + (side < capacity % 4 ? 1 : 0));
      const [north = 0, south = 0, east = 0, west = 0] = perSide;
      return [
        ...spread(north, widthCm).map((x) => ({ xCm: x, yCm: -depthCm / 2 - offset, rotationDeg: 180 })),
        ...spread(south, widthCm).map((x) => ({ xCm: x, yCm: depthCm / 2 + offset, rotationDeg: 0 })),
        ...spread(east, depthCm).map((y) => ({ xCm: widthCm / 2 + offset, yCm: y, rotationDeg: 90 })),
        ...spread(west, depthCm).map((y) => ({ xCm: -widthCm / 2 - offset, yCm: y, rotationDeg: 270 })),
      ];
    }
    case "rect": {
      const north = Math.ceil(capacity / 2);
      const south = capacity - north;
      return [
        ...spread(north, widthCm).map((x) => ({ xCm: x, yCm: -depthCm / 2 - offset, rotationDeg: 180 })),
        ...spread(south, widthCm).map((x) => ({ xCm: x, yCm: depthCm / 2 + offset, rotationDeg: 0 })),
      ];
    }
    default: {
      const unreachable: never = table.shape;
      return unreachable;
    }
  }
}
