import { describe, expect, it, vi } from "vitest";

import { messageKey } from "@/core/i18n";
import type { ModuleManifest, ModuleServer } from "@/core/module";
import { ok } from "@/core/result";
import type { ViewLoaderContext } from "@/core/views";

import { loadSlot, reservationSlotsFilled, slotLoaderOf, slotWriteOf } from "./guest-slots.server";

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

    const data = await loadSlot(
      "bookings.guests",
      context,
      { ids: ["a"] },
      ["filler"],
      [server("other"), server("filler", { "bookings.guests": loader })],
    );

    expect(loader).toHaveBeenCalledWith(context, { ids: ["a"] });
    expect(data.rows).toEqual([{ id: "a" }]);
  });

  it("answers empty, and asks nothing, when no module fills the slot", async () => {
    const loader = vi.fn();

    const data = await loadSlot(
      "bookings.guests",
      context,
      { ids: ["a"] },
      ["filler"],
      [server("filler", { "bookings.guest-search": loader })],
    );

    expect(data).toEqual({ state: { status: "empty" }, rows: [] });
    expect(loader).not.toHaveBeenCalled();
  });

  it("finds a loader by slot only", () => {
    expect(slotLoaderOf([server("other")], "bookings.guest-search")).toBeUndefined();
  });
});

describe("a slot counts as filled only when its filler is enabled in the preset", () => {
  const filler = (id: string) =>
    server(id, { "bookings.guests": async () => ({ state: { status: "ready" }, rows: [] }) });
  const manifest = (id: string): ModuleManifest =>
    ({ id, slots: [{ slot: "bookings.contact-fields", write: `${id}.create` }] }) as unknown as ModuleManifest;

  it("answers empty, and asks nothing, when the filler is installed but not enabled", async () => {
    const loader = vi.fn();

    const data = await loadSlot(
      "bookings.guests",
      context,
      { ids: ["a"] },
      ["bookings"],
      [server("filler", { "bookings.guests": loader })],
    );

    expect([data, loader.mock.calls.length]).toEqual([{ state: { status: "empty" }, rows: [] }, 0]);
  });

  it("names the write of an enabled filler only", () => {
    expect([
      slotWriteOf("bookings.contact-fields", ["filler"], [manifest("filler")]),
      slotWriteOf("bookings.contact-fields", ["bookings"], [manifest("filler")]),
    ]).toEqual(["filler.create", undefined]);
  });

  it("is filled only when the filler of all three slots is enabled", () => {
    const full: ModuleServer = {
      ...filler("filler"),
      slotLoaders: {
        "bookings.guests": async () => ({ state: { status: "ready" }, rows: [] }),
        "bookings.guest-search": async () => ({ state: { status: "ready" }, rows: [] }),
      },
      slotBundles: {
        "bookings.contact-fields": {
          key: messageKey("contact-fields"),
          dictionary: { en: {}, es: {}, de: {}, fr: {} },
        },
      },
    };

    expect([reservationSlotsFilled(["filler"], [full]), reservationSlotsFilled(["bookings"], [full])]).toEqual([
      true,
      false,
    ]);
  });
});
