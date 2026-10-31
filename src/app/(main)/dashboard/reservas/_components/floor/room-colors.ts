import { Color, SRGBColorSpace } from "three";

import type { VisibleTableState } from "./table-state";

const ROOM_TOKENS = [
  "room-paper",
  "room-floor",
  "room-floor-outdoor",
  "room-wall",
  "room-landmark",
  "room-chair",
  "room-plant",
  "room-ink",
  "table-free",
  "table-arriving",
  "table-seated",
  "table-leaving",
  "table-late",
  "table-blocked",
  "table-hatch",
] as const;

export type RoomToken = (typeof ROOM_TOKENS)[number];
export type RoomPalette = Record<RoomToken, Color>;

export const tableStateToken: Record<VisibleTableState, RoomToken> = {
  free: "table-free",
  arriving: "table-arriving",
  seated: "table-seated",
  leaving: "table-leaving",
  late: "table-late",
  blocked: "table-blocked",
};

/**
 * Reads the room tokens from CSS so the scene follows the theme from one place. Any CSS colour syntax (oklch
 * included) is resolved by painting it on a 1×1 canvas and reading the sRGB bytes back.
 */
export function readRoomPalette(element: HTMLElement): RoomPalette {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Room colours need a 2D canvas context to resolve CSS colours");

  const styles = getComputedStyle(element);
  const entries = ROOM_TOKENS.map((token) => {
    const value = styles.getPropertyValue(`--${token}`).trim();
    if (!value) throw new Error(`Missing CSS token --${token}; define it in globals.css`);
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
    return [token, new Color().setRGB(red / 255, green / 255, blue / 255, SRGBColorSpace)] as const;
  });
  return Object.fromEntries(entries) as RoomPalette;
}
