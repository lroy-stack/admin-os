import { describe, expect, it, vi } from "vitest";

import type { ModuleServer } from "@/core/module";
import { ok } from "@/core/result";
import type { ViewLoaderContext } from "@/core/views";

import { loadSlot, slotLoaderOf } from "./guest-slots.server";

const context: ViewLoaderContext = { locale: "en", call: async () => ok({}) };
const server = (id: string, slotLoaders?: ModuleServer["slotLoaders"]): ModuleServer => ({
  id,
  messages: { en: {}, es: {}, de: {}, fr: {} },
  mockHandlers: {},
  ...(slotLoaders === undefined ? {} : { slotLoaders }),
});

describe("loadSlot", () => {
  it("calls the loader of the module that fills the slot, with the params", async () => {
    const loader = vi.fn(async () => ({ state: { status: "ready" } as const, rows: [{ id: "a" }] }));

    const data = await loadSlot("bookings.guests", context, { ids: ["a"] }, [
      server("other"),
      server("filler", { "bookings.guests": loader }),
    ]);

    expect(loader).toHaveBeenCalledWith(context, { ids: ["a"] });
    expect(data.rows).toEqual([{ id: "a" }]);
  });

  it("answers empty, and asks nothing, when no module fills the slot", async () => {
    const loader = vi.fn();

    const data = await loadSlot("bookings.guests", context, { ids: ["a"] }, [
      server("filler", { "bookings.guest-search": loader }),
    ]);

    expect(data).toEqual({ state: { status: "empty" }, rows: [] });
    expect(loader).not.toHaveBeenCalled();
  });

  it("finds a loader by slot only", () => {
    expect(slotLoaderOf([server("other")], "bookings.guest-search")).toBeUndefined();
  });
});
