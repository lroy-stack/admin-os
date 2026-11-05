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
  search: { label: "Search products", placeholder: "Search products…" },
  clearFilters: "Clear filters",
  filters: { statusLabel: "Filter product status", allStatuses: "All statuses" },
  statuses: { active: "Active", inactive: "Inactive", archived: "Archived" },
  columns: { product: "Product", price: "Price", status: "Status" },
  empty: { title: "No products yet", description: "Items you add to this view will appear here." },
  table: {
    label: "Products",
    emptyTitle: "No products found",
    emptyDescription: "Try another search or clear your filters.",
    range: { one: "{from} – {to} of {total} product", other: "{from} – {to} of {total} products" },
    rowsPerPage: "Rows per page",
    pagesLabel: "Product pages",
    previousPage: "Previous page",
    nextPage: "Next page",
    page: "Page {page}",
  },
};

const es: ProductsMessages = {
  meta: {
    title: "Productos",
    description: "Consulta lo que vende el negocio, por vista, con precios y disponibilidad.",
  },
  title: "Productos",
  subtitle: "Lo que vendes, con precios y disponibilidad.",
  viewsLabel: "Vistas de productos",
  search: { label: "Buscar productos", placeholder: "Buscar productos…" },
  clearFilters: "Borrar filtros",
  filters: { statusLabel: "Filtrar por estado del producto", allStatuses: "Todos los estados" },
  statuses: { active: "Activo", inactive: "Inactivo", archived: "Archivado" },
  columns: { product: "Producto", price: "Precio", status: "Estado" },
  empty: { title: "Aún no hay productos", description: "Los artículos que añadas a esta vista aparecerán aquí." },
  table: {
    label: "Productos",
    emptyTitle: "No se encontraron productos",
    emptyDescription: "Prueba con otra búsqueda o borra los filtros.",
    range: { one: "{from} – {to} de {total} producto", other: "{from} – {to} de {total} productos" },
    rowsPerPage: "Filas por página",
    pagesLabel: "Páginas de productos",
    previousPage: "Página anterior",
    nextPage: "Página siguiente",
    page: "Página {page}",
  },
};

const de: ProductsMessages = {
  meta: {
    title: "Produkte",
    description: "Sieh, was der Betrieb verkauft, nach Ansicht, mit Preisen und Verfügbarkeit.",
  },
  title: "Produkte",
  subtitle: "Was du verkaufst, mit Preisen und Verfügbarkeit.",
  viewsLabel: "Produktansichten",
  search: { label: "Produkte suchen", placeholder: "Produkte suchen…" },
  clearFilters: "Filter zurücksetzen",
  filters: { statusLabel: "Produktstatus filtern", allStatuses: "Alle Status" },
  statuses: { active: "Aktiv", inactive: "Inaktiv", archived: "Archiviert" },
  columns: { product: "Produkt", price: "Preis", status: "Status" },
  empty: { title: "Noch keine Produkte", description: "Artikel, die du dieser Ansicht hinzufügst, erscheinen hier." },
  table: {
    label: "Produkte",
    emptyTitle: "Keine Produkte gefunden",
    emptyDescription: "Versuche es mit einer anderen Suche oder setze die Filter zurück.",
    range: { one: "{from} – {to} von {total} Produkt", other: "{from} – {to} von {total} Produkten" },
    rowsPerPage: "Zeilen pro Seite",
    pagesLabel: "Produktseiten",
    previousPage: "Vorherige Seite",
    nextPage: "Nächste Seite",
    page: "Seite {page}",
  },
};

const fr: ProductsMessages = {
  meta: {
    title: "Produits",
    description: "Consultez ce que vend l’établissement, par vue, avec prix et disponibilité.",
  },
  title: "Produits",
  subtitle: "Ce que vous vendez, avec prix et disponibilité.",
  viewsLabel: "Vues des produits",
  search: { label: "Rechercher des produits", placeholder: "Rechercher des produits…" },
  clearFilters: "Effacer les filtres",
  filters: { statusLabel: "Filtrer par statut du produit", allStatuses: "Tous les statuts" },
  statuses: { active: "Actif", inactive: "Inactif", archived: "Archivé" },
  columns: { product: "Produit", price: "Prix", status: "Statut" },
  empty: { title: "Aucun produit pour l’instant", description: "Les articles ajoutés à cette vue apparaîtront ici." },
  table: {
    label: "Produits",
    emptyTitle: "Aucun produit trouvé",
    emptyDescription: "Essayez une autre recherche ou effacez les filtres.",
    range: { one: "{from} – {to} sur {total} produit", other: "{from} – {to} sur {total} produits" },
    rowsPerPage: "Lignes par page",
    pagesLabel: "Pages de produits",
    previousPage: "Page précédente",
    nextPage: "Page suivante",
    page: "Page {page}",
  },
};

export const productsMessages = defineMessages<ProductsMessages>({ en, es, de, fr });

export const productsBundle: MessageBundle<ProductsMessages> = {
  key: productsMessageKey,
  dictionary: productsMessages,
};
