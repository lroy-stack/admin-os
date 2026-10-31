import { Color } from "three";
import { describe, expect, it } from "vitest";

import { ROOM_TOKENS, type RoomPalette, type RoomToken, watchRoomPalette } from "./room-colors";

const paletteOf = (hex: number): RoomPalette => ({
  ...(Object.fromEntries(ROOM_TOKENS.map((token) => [token, new Color(hex)])) as Record<RoomToken, Color>),
  chairTint: 0.65,
});

/** Stands in for MutationObserver: records what is observed and lets the test fire a mutation. */
class FakeObserver {
  static last: FakeObserver | null = null;
  options: MutationObserverInit | undefined;
  disconnected = false;

  constructor(private readonly callback: MutationCallback) {
    FakeObserver.last = this;
  }

  observe(_target: Node, options?: MutationObserverInit) {
    this.options = options;
  }

  disconnect() {
    this.disconnected = true;
  }

  fire() {
    this.callback([], this as unknown as MutationObserver);
  }
}

function watch(reads: RoomPalette[]) {
  const changes: RoomPalette[] = [];
  const queue = [...reads];
  const stop = watchRoomPalette(
    {} as Node,
    () => queue.shift() ?? paletteOf(0),
    (palette) => changes.push(palette),
    FakeObserver,
  );
  const observer = FakeObserver.last;
  if (!observer) throw new Error("watchRoomPalette did not create an observer");
  return { changes, stop, observer };
}

describe("watchRoomPalette", () => {
  it("watches the theme preset and the mode class on the root", () => {
    const { observer } = watch([paletteOf(0xffffff)]);
    expect(observer.options).toEqual({ attributes: true, attributeFilter: ["class", "data-theme-preset"] });
  });

  it("reports the new palette when the theme changes the room colours", () => {
    const dark = paletteOf(0x333333);
    const { changes, observer } = watch([paletteOf(0xffffff), dark]);
    observer.fire();
    expect(changes).toEqual([dark]);
  });

  it("ignores attribute changes that leave the room colours alone", () => {
    const { changes, observer } = watch([paletteOf(0xffffff), paletteOf(0xffffff)]);
    observer.fire();
    expect(changes).toEqual([]);
  });

  it("stops observing when the returned function runs", () => {
    const { stop, observer } = watch([paletteOf(0xffffff)]);
    stop();
    expect(observer.disconnected).toBe(true);
  });
});
