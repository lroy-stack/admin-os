import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type ProductsMessages, productsMessageKey } from "./messages";

const en: ProductsMessages = {
  meta: {
    title: "Products",
    description: "Browse what the business sells, by view, with prices and availability.",
  },
  title: "Products",
  subtitle: "What you sell, with prices and availability.",
  viewsLabel: "Product views",
};

const es: ProductsMessages = {
  meta: {
    title: "Productos",
    description: "Consulta lo que vende el negocio, por vista, con precios y disponibilidad.",
  },
  title: "Productos",
  subtitle: "Lo que vendes, con precios y disponibilidad.",
  viewsLabel: "Vistas de productos",
};

const de: ProductsMessages = {
  meta: {
    title: "Produkte",
    description: "Sieh, was der Betrieb verkauft, nach Ansicht, mit Preisen und Verfügbarkeit.",
  },
  title: "Produkte",
  subtitle: "Was du verkaufst, mit Preisen und Verfügbarkeit.",
  viewsLabel: "Produktansichten",
};

const fr: ProductsMessages = {
  meta: {
    title: "Produits",
    description: "Consultez ce que vend l’établissement, par vue, avec prix et disponibilité.",
  },
  title: "Produits",
  subtitle: "Ce que vous vendez, avec prix et disponibilité.",
  viewsLabel: "Vues des produits",
};

export const productsMessages = defineMessages<ProductsMessages>({ en, es, de, fr });

export const productsBundle: MessageBundle<ProductsMessages> = {
  key: productsMessageKey,
  dictionary: productsMessages,
};
