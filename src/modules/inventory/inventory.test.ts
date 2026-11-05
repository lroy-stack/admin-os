import { describe, expect, it } from "vitest";

import { descriptorViolations } from "@/core/capability";
import { createClient } from "@/core/client";
import type { BusinessClock } from "@/core/clock";
import { createMockAdapter, createSessionStore } from "@/core/mock";
import type { CallResult } from "@/core/result";

import { inventoryCapabilities, inventoryOrdersList, inventoryStockList } from "./capabilities";
import { inventoryMockHandlers } from "./mock";
import type { PurchaseOrder, StockItem } from "./schema";

const clock: BusinessClock = {
  businessDay: "2026-10-31",
  today: "2026-10-31",
  nowMin: 600,
  cutoffMin: 0,
  timeZone: "Europe/Madrid",
};

const name = (source: string) => ({ source, translations: {} });
const eur = (amountMinor: number) => ({ amountMinor, currency: "EUR" });

const stock: StockItem[] = [
  { id: "s1", name: name("Oil"), sku: "O1", unit: "bottle", onHand: 2, reorderPoint: 5, supplierId: "p-trade" },
  { id: "s2", name: name("Wine"), sku: "W1", unit: "bottle", onHand: 5, reorderPoint: 5, supplierId: "p-legal" },
  { id: "s3", name: name("Salt"), sku: "S1", unit: "kg", onHand: 9, reorderPoint: 5, supplierId: "p-gone" },
  { id: "s4", name: name("Pepper"), sku: "P1", unit: "kg", onHand: 9, reorderPoint: 5 },
];

const orders: PurchaseOrder[] = [
  {
    id: "o1",
    supplierId: "p-trade",
    status: "draft",
    lines: [{ stockItemId: "s1", qty: 3, unitCost: eur(100) }],
    orderedOn: "2026-10-30",
  },
  {
    id: "o2",
    supplierId: "p-gone",
    status: "sent",
    lines: [{ stockItemId: "s2", qty: 1, unitCost: eur(100) }],
    orderedOn: "2026-10-30",
  },
];

const parties = [
  { id: "p-trade", legalName: "Trade Legal S.L.", tradeName: "Trade Name" },
  { id: "p-legal", legalName: "Only Legal S.L." },
];

const clientOver = (partyRows?: typeof parties) =>
  createClient(
    inventoryCapabilities,
    createMockAdapter({
      handlers: inventoryMockHandlers,
      store: createSessionStore({
        stockItems: stock,
        purchaseOrders: orders,
        ...(partyRows === undefined ? {} : { parties: partyRows }),
      }),
      clock,
    }),
    {
      actor: { actorId: "demo-staff", roleId: "staff", permissions: ["read:inventory"] },
      retryDelayMs: 0,
      logger: () => undefined,
      mode: "production",
    },
  );

const withParties = clientOver(parties);
const withoutParties = clientOver();

const itemsOf = (result: CallResult<unknown>) => {
  if (!("ok" in result) || !result.ok) throw new Error(`Expected a success, got ${JSON.stringify(result)}`);
  return (result.value as { items: { id: string; supplierName?: string }[] }).items;
};

describe("inventory.stock.list", () => {
  it.each([inventoryStockList, inventoryOrdersList])("passes the descriptor rules of $id", (capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });

  it("lists every item with the supplier's trade name, else legal name", async () => {
    expect(itemsOf(await withParties.call("inventory.stock.list", {})).map((i) => [i.id, i.supplierName])).toEqual([
      ["s1", "Trade Name"],
      ["s2", "Only Legal S.L."],
      ["s3", undefined],
      ["s4", undefined],
    ]);
  });

  it("keeps only the items at or under their reorder point with belowReorder", async () => {
    expect(itemsOf(await withParties.call("inventory.stock.list", { belowReorder: true })).map((i) => i.id)).toEqual([
      "s1",
      "s2",
    ]);
  });

  it("leaves supplierName out when the parties collection is absent", async () => {
    expect(itemsOf(await withoutParties.call("inventory.stock.list", {})).map((i) => i.supplierName)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });
});

describe("inventory.orders.list", () => {
  it("names the supplier of each order it can resolve", async () => {
    expect(itemsOf(await withParties.call("inventory.orders.list", {})).map((o) => [o.id, o.supplierName])).toEqual([
      ["o1", "Trade Name"],
      ["o2", undefined],
    ]);
  });

  it("filters by status", async () => {
    expect(itemsOf(await withParties.call("inventory.orders.list", { status: "sent" })).map((o) => o.id)).toEqual([
      "o2",
    ]);
  });

  it("answers without supplier names when the parties collection is absent", async () => {
    expect(itemsOf(await withoutParties.call("inventory.orders.list", {})).map((o) => o.supplierName)).toEqual([
      undefined,
      undefined,
    ]);
  });
});
