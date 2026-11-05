import type { PurchaseOrder, StockItem } from "@/modules/inventory";

import { catalog } from "./catalog";
import { eur } from "./shared";

/** What the business keeps (ADR 0018 §1); `supplierId` names a supplier in `parties`. */
/** A catalog item's name, so a stock item bought as the part it is sold as carries the same words. */
const catalogName = (id: string) => {
  const item = catalog.find((candidate) => candidate.id === id);
  if (item === undefined) throw new Error(`No catalog item ${id}`);
  return item.name;
};

export const stockItems: StockItem[] = [
  {
    id: "stock-brake-pads",
    name: catalogName("part-brake-pads"),
    sku: "BP-F-118",
    catalogItemId: "part-brake-pads",
    unit: "set",
    onHand: 6,
    reorderPoint: 3,
    supplierId: "distribuciones-levante",
  },
  {
    id: "stock-oil-filter",
    name: catalogName("part-oil-filter"),
    sku: "OF-204",
    catalogItemId: "part-oil-filter",
    unit: "unit",
    onHand: 14,
    reorderPoint: 5,
    supplierId: "distribuciones-levante",
  },
  {
    id: "stock-air-filter",
    name: catalogName("part-air-filter"),
    sku: "AF-311",
    catalogItemId: "part-air-filter",
    unit: "unit",
    onHand: 9,
    reorderPoint: 4,
    supplierId: "recambios-norte",
  },
  {
    id: "stock-wiper-blades",
    name: catalogName("part-wiper-blades"),
    sku: "WB-450",
    catalogItemId: "part-wiper-blades",
    unit: "pair",
    onHand: 4,
    reorderPoint: 6,
    supplierId: "recambios-norte",
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-W-1",
    supplierId: "distribuciones-levante",
    status: "received",
    lines: [
      { stockItemId: "stock-brake-pads", qty: 4, unitCost: eur(2800) },
      { stockItemId: "stock-oil-filter", qty: 10, unitCost: eur(650) },
    ],
    orderedOn: "2026-10-12",
    expectedOn: "2026-10-16",
  },
  {
    id: "PO-W-2",
    supplierId: "recambios-norte",
    status: "sent",
    lines: [
      { stockItemId: "stock-wiper-blades", qty: 8, unitCost: eur(1100) },
      { stockItemId: "stock-air-filter", qty: 6, unitCost: eur(900) },
    ],
    orderedOn: "2026-10-29",
    expectedOn: "2026-11-03",
  },
  {
    id: "PO-W-3",
    supplierId: "distribuciones-levante",
    status: "draft",
    lines: [{ stockItemId: "stock-brake-pads", qty: 6, unitCost: eur(2800) }],
    orderedOn: "2026-10-31",
  },
  {
    id: "PO-W-4",
    supplierId: "recambios-norte",
    status: "cancelled",
    lines: [{ stockItemId: "stock-air-filter", qty: 12, unitCost: eur(950) }],
    orderedOn: "2026-10-05",
  },
];
