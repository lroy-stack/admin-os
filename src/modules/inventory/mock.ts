import { collectionOf, type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";

import { inventoryOrdersList, inventoryStockList } from "./capabilities";
import type { PurchaseOrder, StockItem } from "./schema";

/** The slice of a party this module reads (ADR 0017 §3); `parties` is optional, so the collection may be absent. */
interface PartyName {
  readonly id: string;
  readonly legalName: string;
  readonly tradeName?: string;
}

interface InventoryData {
  readonly stockItems: StockItem[];
  readonly purchaseOrders: PurchaseOrder[];
  readonly parties?: PartyName[];
}

type Context = MockContext<InventoryData>;

/** `{ supplierName }` for a supplier that resolves, else nothing. */
const supplierOf = (data: InventoryData, supplierId: string | undefined) => {
  const party =
    supplierId === undefined ? undefined : collectionOf(data, "parties").find(({ id }) => id === supplierId);
  return party === undefined ? {} : { supplierName: party.tradeName ?? party.legalName };
};

/** Mock answers for the inventory module (ADR 0005); `src/config/data.server.ts` wires them with the preset seed. */
export const inventoryMockHandlers = {
  ...mockHandler(inventoryStockList, ({ belowReorder, ...page }, { data }: Context) => {
    const kept = data.stockItems.filter((item) => belowReorder !== true || item.onHand <= item.reorderPoint);
    return paginate(
      kept.map((item) => ({ ...item, ...supplierOf(data, item.supplierId) })),
      page,
    );
  }),

  ...mockHandler(inventoryOrdersList, ({ status, ...page }, { data }: Context) => {
    const kept = data.purchaseOrders.filter((order) => status === undefined || order.status === status);
    return paginate(
      kept.map((order) => ({ ...order, ...supplierOf(data, order.supplierId) })),
      page,
    );
  }),
};
