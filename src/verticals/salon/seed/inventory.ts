import type { PurchaseOrder, StockItem } from "@/modules/inventory";

import { eur, text } from "./shared";

/** What the business keeps (ADR 0018 §1); `supplierId` names a supplier in `parties`. */
export const stockItems: StockItem[] = [
  {
    id: "stock-shampoo",
    name: text(
      "Repair shampoo, 250 ml",
      "Champú reparador, 250 ml",
      "Reparaturshampoo, 250 ml",
      "Shampooing réparateur, 250 ml",
    ),
    sku: "SH-250",
    catalogItemId: "retail-shampoo",
    unit: "bottle",
    onHand: 12,
    reorderPoint: 6,
    supplierId: "cosmetics-distributor",
  },
  {
    id: "stock-conditioner",
    name: text("Conditioner, 250 ml", "Acondicionador, 250 ml", "Spülung, 250 ml", "Après-shampooing, 250 ml"),
    sku: "CO-250",
    catalogItemId: "retail-conditioner",
    unit: "bottle",
    onHand: 9,
    reorderPoint: 6,
    supplierId: "cosmetics-distributor",
  },
  {
    id: "stock-wax",
    name: text("Styling wax, 75 ml", "Cera de peinado, 75 ml", "Stylingwachs, 75 ml", "Cire coiffante, 75 ml"),
    sku: "WX-075",
    catalogItemId: "retail-wax",
    unit: "jar",
    onHand: 3,
    reorderPoint: 5,
    supplierId: "cosmetics-distributor",
  },
  {
    id: "stock-dye",
    name: text("Hair dye, 60 ml tube", "Tinte capilar, tubo 60 ml", "Haarfarbe, 60-ml-Tube", "Coloration, tube 60 ml"),
    sku: "DY-060",
    unit: "tube",
    onHand: 24,
    reorderPoint: 10,
    supplierId: "cosmetics-distributor",
  },
  {
    id: "stock-developer",
    name: text("Developer, 1 litre", "Oxidante, 1 litro", "Entwickler, 1 Liter", "Oxydant, 1 litre"),
    sku: "DV-1000",
    unit: "litre",
    onHand: 5,
    reorderPoint: 4,
    supplierId: "cosmetics-distributor",
  },
];

export const purchaseOrders: PurchaseOrder[] = [
  {
    id: "PO-S-1",
    supplierId: "cosmetics-distributor",
    status: "sent",
    lines: [
      { stockItemId: "stock-wax", qty: 6, unitCost: eur(780) },
      { stockItemId: "stock-dye", qty: 12, unitCost: eur(420) },
    ],
    orderedOn: "2026-10-28",
    expectedOn: "2026-11-04",
  },
  {
    id: "PO-S-2",
    supplierId: "cosmetics-distributor",
    status: "received",
    lines: [{ stockItemId: "stock-developer", qty: 6, unitCost: eur(690) }],
    orderedOn: "2026-10-14",
    expectedOn: "2026-10-18",
  },
];
