import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CatalogCollectionMessages, catalogCollectionMessageKey } from "./views/messages";

const en: CatalogCollectionMessages = {
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

const es: CatalogCollectionMessages = {
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

const de: CatalogCollectionMessages = {
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

const fr: CatalogCollectionMessages = {
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

export const catalogCollectionMessages = defineMessages<CatalogCollectionMessages>({ en, es, de, fr });

/** Pass to `LocaleBundles` on a screen that shows the collection table. */
export const catalogCollectionBundle: MessageBundle<CatalogCollectionMessages> = {
  key: catalogCollectionMessageKey,
  dictionary: catalogCollectionMessages,
};
