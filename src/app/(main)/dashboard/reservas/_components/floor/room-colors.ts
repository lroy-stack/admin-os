import { Color, SRGBColorSpace } from "three";

import type { VisibleTableState } from "./table-state";

export const ROOM_TOKENS = [
  "room-paper",
  "room-floor",
  "room-floor-outdoor",
  "room-wall",
  "room-landmark",
  "room-chair",
  "room-chair-wash",
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
/** Room colours plus `chairTint`, the share of the state colour that chairs of a table in use take on. */
export type RoomPalette = Record<RoomToken, Color> & { chairTint: number };

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
  const chairTint = Number.parseFloat(styles.getPropertyValue("--room-chair-tint"));
  if (Number.isNaN(chairTint)) throw new Error("Missing CSS token --room-chair-tint; define it in tokens.css");
  return { ...(Object.fromEntries(entries) as Record<RoomToken, Color>), chairTint };
}

/** Attributes on <html> that change the room: the theme preset and the `dark` class of the mode. */
const THEME_ATTRIBUTES = ["class", "data-theme-preset"];

type ObserverConstructor = new (callback: MutationCallback) => Pick<MutationObserver, "observe" | "disconnect">;

const paletteSignature = (palette: RoomPalette) =>
  [...ROOM_TOKENS.map((token) => palette[token].getHexString()), palette.chairTint].join(" ");

/**
 * Calls `onChange` with a freshly read palette whenever the theme preset or mode on `root` changes the room colours.
 * Class changes that leave the colours alone (`disable-transitions` while the mode flips) are ignored.
 * Returns the function that stops watching.
 */
export function watchRoomPalette(
  root: Node,
  read: () => RoomPalette,
  onChange: (palette: RoomPalette) => void,
  Observer: ObserverConstructor = MutationObserver,
): () => void {
  let current = paletteSignature(read());
  const observer = new Observer(() => {
    const next = read();
    const signature = paletteSignature(next);
    if (signature === current) return;
    current = signature;
    onChange(next);
  });
  observer.observe(root, { attributes: true, attributeFilter: THEME_ATTRIBUTES });
  return () => observer.disconnect();
}
