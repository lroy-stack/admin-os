import { describe, expect, it } from "vitest";

import { err, ok } from "@/core/result";
import type { ViewLoaderContext } from "@/core/views";

import { loadOrders, loadStock } from "./view-loaders";

const eur = (amountMinor: number) => ({ amountMinor, currency: "EUR" });
const name = (en: string, es: string) => ({ source: en, translations: { en, es } });

const stockPage = {
  items: [
    { id: "a", name: name("Wax", "Cera"), sku: "WX", unit: "jar", onHand: 3, reorderPoint: 5, supplierName: "Acme" },
    { id: "b", name: name("Dye", "Tinte"), sku: "DY", unit: "tube", onHand: 5, reorderPoint: 5 },
    { id: "c", name: { source: "Gel", translations: {} }, sku: "GL", unit: "tube", onHand: 9, reorderPoint: 5 },
  ],
  nextCursor: null,
};

const orderPage = {
  items: [
    {
      id: "PO-1",
      status: "sent",
      orderedOn: "2026-10-28",
      expectedOn: "2026-11-04",
      supplierName: "Acme",
      lines: [
        { stockItemId: "a", qty: 6, unitCost: eur(780) },
        { stockItemId: "b", qty: 12, unitCost: eur(420) },
      ],
    },
    { id: "PO-2", status: "draft", orderedOn: "2026-10-31", lines: [{ stockItemId: "a", qty: 1, unitCost: eur(100) }] },
  ],
  nextCursor: null,
};

const contextFor = (answer: Awaited<ReturnType<ViewLoaderContext["call"]>>, locale: "en" | "es" = "en") => {
  const calls: { capability: string; input: unknown }[] = [];
  const context: ViewLoaderContext = {
    locale,
    call: async (capability, input) => {
      calls.push({ capability, input });
      return answer;
    },
  };
  return { context, calls };
};

describe("loadStock", () => {
  it("reads inventory.stock.list and returns plain rows in the locale", async () => {
    const { context, calls } = contextFor(ok(stockPage), "es");

    const data = await loadStock(context, {});

    expect(calls).toEqual([{ capability: "inventory.stock.list", input: { limit: 200 } }]);
    expect(data.state).toEqual({ status: "ready" });
    expect(data.rows).toEqual([
      { id: "a", name: "Cera", sku: "WX", onHand: 3, unit: "jar", belowReorder: true, supplierName: "Acme" },
      { id: "b", name: "Tinte", sku: "DY", onHand: 5, unit: "tube", belowReorder: true },
      { id: "c", name: "Gel", sku: "GL", onHand: 9, unit: "tube", belowReorder: false },
    ]);
  });

  it("leaves supplierName out of a row whose supplier is absent", async () => {
    const data = await loadStock(contextFor(ok(stockPage)).context, {});

    expect(data.rows.map((row) => "supplierName" in (row as object))).toEqual([true, false, false]);
  });

  it("says empty for a read that succeeded with no rows", async () => {
    const data = await loadStock(contextFor(ok({ items: [], nextCursor: null })).context, {});

    expect(data).toEqual({ state: { status: "empty" }, rows: [] });
  });

  it("says forbidden, with the reason, never empty, when the read is refused", async () => {
    const data = await loadStock(contextFor(err("access.forbidden", "no")).context, {});

    expect(data.state).toEqual({ status: "forbidden", code: "access.forbidden" });
    expect(data.reason).toBe("You do not have permission to do this.");
    expect(data.rows).toEqual([]);
  });
});

describe("loadOrders", () => {
  it("reads inventory.orders.list and sums qty × unitCost for each order's total", async () => {
    const { context, calls } = contextFor(ok(orderPage));

    const data = await loadOrders(context, {});

    expect(calls).toEqual([{ capability: "inventory.orders.list", input: { limit: 200 } }]);
    expect(data.rows).toEqual([
      {
        id: "PO-1",
        status: "sent",
        orderedOn: "2026-10-28",
        expectedOn: "2026-11-04",
        total: eur(6 * 780 + 12 * 420),
        supplierName: "Acme",
      },
      { id: "PO-2", status: "draft", orderedOn: "2026-10-31", total: eur(100) },
    ]);
  });

  it("leaves out supplierName and expectedOn when the order has none", async () => {
    const data = await loadOrders(contextFor(ok(orderPage)).context, {});
    const second = data.rows[1] as object;

    expect("supplierName" in second).toBe(false);
    expect("expectedOn" in second).toBe(false);
  });

  it("follows the cursor to the last page", async () => {
    const pages = [
      ok({ items: [orderPage.items[0]], nextCursor: "next" }),
      ok({ items: [orderPage.items[1]], nextCursor: null }),
    ];
    const calls: unknown[] = [];
    const context: ViewLoaderContext = {
      locale: "en",
      call: async (_capability, input) => {
        calls.push(input);
        return pages[calls.length - 1] ?? err("x.y", "none");
      },
    };

    const data = await loadOrders(context, {});

    expect(data.rows.map((row) => (row as { id: string }).id)).toEqual(["PO-1", "PO-2"]);
    expect(calls).toEqual([{ limit: 200 }, { limit: 200, cursor: "next" }]);
  });
});
