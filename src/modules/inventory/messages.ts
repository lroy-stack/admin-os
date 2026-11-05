import { defineMessages, type Plural } from "@/core/i18n";

export interface InventoryMessages {
  readonly title: string;
  readonly stock: string;
  readonly orders: string;
  readonly count: Plural;
}

export const inventoryMessages = defineMessages<InventoryMessages>({
  en: {
    title: "Inventory",
    stock: "Stock",
    orders: "Purchase orders",
    count: { one: "{count} stock item", other: "{count} stock items" },
  },
  es: {
    title: "Inventario",
    stock: "Existencias",
    orders: "Pedidos de compra",
    count: { one: "{count} artículo en stock", other: "{count} artículos en stock" },
  },
  de: {
    title: "Lager",
    stock: "Bestand",
    orders: "Bestellungen",
    count: { one: "{count} Lagerartikel", other: "{count} Lagerartikel" },
  },
  fr: {
    title: "Stock",
    stock: "Stock",
    orders: "Commandes d’achat",
    count: { one: "{count} article en stock", other: "{count} articles en stock" },
  },
});
