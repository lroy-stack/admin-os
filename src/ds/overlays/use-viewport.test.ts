import { afterEach, describe, expect, it, vi } from "vitest";

import { readViewport, subscribeViewport } from "./use-viewport";

/** A window whose `matchMedia` answers min-width queries for a width the test can change. */
function stubWindow(initialWidth: number) {
  let width = initialWidth;
  const listeners = new Set<() => void>();
  vi.stubGlobal("window", {
    matchMedia: (query: string) => {
      const minWidth = Number(/min-width: (\d+)px/.exec(query)?.[1]);
      return {
        get matches() {
          return width >= minWidth;
        },
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      };
    },
  });
  return {
    resize(next: number) {
      width = next;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("readViewport", () => {
  it.each([
    [375, "phone"],
    [767, "phone"],
    [768, "tablet"],
    [1023, "tablet"],
    [1024, "desktop"],
    [1440, "desktop"],
  ])("reads %i px as %s", (width, expected) => {
    stubWindow(width);

    expect(readViewport()).toBe(expected);
  });
});

describe("subscribeViewport", () => {
  it("notifies when the breakpoint changes and stops after unsubscribing", () => {
    const screen = stubWindow(1440);
    const onChange = vi.fn();

    const unsubscribe = subscribeViewport(onChange);
    screen.resize(375);
    unsubscribe();

    expect(onChange).toHaveBeenCalled();
    expect(readViewport()).toBe("phone");
    expect(screen.listenerCount()).toBe(0);
  });
});
