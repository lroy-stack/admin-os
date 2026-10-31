import { defineMessages, type Plural } from "@/core/i18n";

export interface CatalogMessages {
  readonly title: string;
  readonly count: Plural;
}

export const catalogMessages = defineMessages<CatalogMessages>({
  en: { title: "Catalog", count: { one: "{count} item", other: "{count} items" } },
  es: { title: "Catálogo", count: { one: "{count} artículo", other: "{count} artículos" } },
  de: { title: "Katalog", count: { one: "{count} Artikel", other: "{count} Artikel" } },
  fr: { title: "Catalogue", count: { one: "{count} article", other: "{count} articles" } },
});
