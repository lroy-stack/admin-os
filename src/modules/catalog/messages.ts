import { defineMessages, type Plural } from "@/core/i18n";

export interface CatalogMessages {
  readonly title: string;
  readonly count: Plural;
  /** Default labels of common collections; a preset's vocabulary overrides them in its own words (ADR 0018 §3). */
  readonly collections: {
    readonly shop: string;
    readonly parts: string;
  };
}

export const catalogMessages = defineMessages<CatalogMessages>({
  en: {
    title: "Catalog",
    count: { one: "{count} item", other: "{count} items" },
    collections: { shop: "Shop", parts: "Parts" },
  },
  es: {
    title: "Catálogo",
    count: { one: "{count} artículo", other: "{count} artículos" },
    collections: { shop: "Tienda", parts: "Piezas" },
  },
  de: {
    title: "Katalog",
    count: { one: "{count} Artikel", other: "{count} Artikel" },
    collections: { shop: "Shop", parts: "Teile" },
  },
  fr: {
    title: "Catalogue",
    count: { one: "{count} article", other: "{count} articles" },
    collections: { shop: "Boutique", parts: "Pièces" },
  },
});
