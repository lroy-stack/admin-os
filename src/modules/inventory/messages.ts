import { defineMessages, type Plural } from "@/core/i18n";

export interface InventoryMessages {
  readonly title: string;
  readonly stock: string;
  readonly orders: string;
  readonly count: Plural;
  /** Default labels of the product views; a preset's vocabulary may rename them (ADR 0018 §3). */
  readonly views: { readonly stock: string; readonly orders: string };
}

export const inventoryMessages = defineMessages<InventoryMessages>({
  en: {
    title: "Inventory",
    stock: "Stock",
    orders: "Purchase orders",
    count: { one: "{count} stock item", other: "{count} stock items" },
    views: { stock: "Stock", orders: "Supplier orders" },
  },
  es: {
    title: "Inventario",
    stock: "Existencias",
    orders: "Pedidos de compra",
    count: { one: "{count} artículo en stock", other: "{count} artículos en stock" },
    views: { stock: "Existencias", orders: "Pedidos a proveedores" },
  },
  de: {
    title: "Lager",
    stock: "Bestand",
    orders: "Bestellungen",
    count: { one: "{count} Lagerartikel", other: "{count} Lagerartikel" },
    views: { stock: "Bestand", orders: "Lieferantenbestellungen" },
  },
  fr: {
    title: "Stock",
    stock: "Stock",
    orders: "Commandes d’achat",
    count: { one: "{count} article en stock", other: "{count} articles en stock" },
    views: { stock: "Stock", orders: "Commandes fournisseurs" },
  },
});
