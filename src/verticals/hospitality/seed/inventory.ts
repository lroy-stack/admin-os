import type { PurchaseOrder, StockItem } from "@/modules/inventory";

import { eur, text } from "./shared";

/** What the business keeps (ADR 0018 §1); `supplierId` names a supplier in `parties`. */
export const stockItems: StockItem[] = [
  {
    id: "stock-olive-oil",
    name: text("Olive oil, 500 ml", "Aceite de oliva, 500 ml", "Olivenöl, 500 ml", "Huile d’olive, 500 ml"),
    sku: "OO-500",
    catalogItemId: "shop-olive-oil",
    unit: "bottle",
    onHand: 18,
    reorderPoint: 8,
    supplierId: "food-distributor",
  },
  {
    id: "stock-red-wine",
    name: text("Red wine, 75 cl", "Vino tinto, 75 cl", "Rotwein, 75 cl", "Vin rouge, 75 cl"),
    sku: "RW-075",
    catalogItemId: "shop-red-wine",
    unit: "bottle",
    onHand: 30,
    reorderPoint: 24,
    supplierId: "winery",
  },
  {
    id: "stock-paprika",
    name: text(
      "Smoked paprika, 75 g",
      "Pimentón ahumado, 75 g",
      "Geräuchertes Paprikapulver, 75 g",
      "Paprika fumé, 75 g",
    ),
    sku: "PP-075",
    catalogItemId: "shop-paprika",
    unit: "tin",
    onHand: 4,
    reorderPoint: 10,
    supplierId: "food-distributor",
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-H-1",
    supplierId: "food-distributor",
    status: "sent",
    lines: [
      { stockItemId: "stock-paprika", qty: 24, unitCost: eur(320) },
      { stockItemId: "stock-olive-oil", qty: 12, unitCost: eur(640) },
    ],
    orderedOn: "2026-10-30",
    expectedOn: "2026-11-03",
  },
  {
    id: "PO-H-2",
    supplierId: "winery",
    status: "received",
    lines: [{ stockItemId: "stock-red-wine", qty: 48, unitCost: eur(540) }],
    orderedOn: "2026-10-20",
    expectedOn: "2026-10-25",
  },
];
