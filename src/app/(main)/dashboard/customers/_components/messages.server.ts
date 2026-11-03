import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CustomerDirectoryMessages, customerDirectoryMessageKey } from "./messages";

const en: CustomerDirectoryMessages = {
  meta: {
    title: "Customers",
    description: "Everyone who has booked with you, with visits, spend, last visit and a way to reach them.",
  },
  search: { label: "Search contacts", placeholder: "Search name, email, phone, tag…" },
  statusLabel: "Show",
  status: { all: "All", vip: "VIP", blocked: "Blocked" },
  views: { label: "Directory view", grid: "Grid", table: "Table" },
  sort: {
    label: "Sort by",
    name: "Name (A–Z)",
    lastVisit: "Last visit",
    visits: "Most visits",
    spend: "Highest spend",
  },
  export: "Export",
  empty: {
    noContactsTitle: "No contacts yet",
    noContacts: "People who book with you will appear here.",
    noMatchTitle: "No contacts found",
    noMatch: "Nothing matches “{query}”.",
    noMatchFilter: "No contact fits this filter.",
  },
  card: {
    visits: "Visits",
    spend: "Spend",
    lastVisit: "Last visit",
    never: "No visits yet",
    vip: "VIP",
    blocked: "Blocked",
    email: "Email {name}",
    call: "Call {name}",
  },
  table: { customer: "Name", visits: "Visits", spend: "Spend", lastVisit: "Last visit", contact: "Contact" },
  csv: {
    name: "Name",
    email: "Email",
    phone: "Phone",
    tags: "Tags",
    vip: "VIP",
    blocked: "Blocked",
    visits: "Visits",
    spend: "Spend",
    currency: "Currency",
    lastVisit: "Last visit",
    yes: "Yes",
    no: "No",
  },
  pager: { label: "Pages", next: "Next page", first: "First page" },
};

const es: CustomerDirectoryMessages = {
  meta: {
    title: "Clientes",
    description: "Todas las personas que han reservado contigo, con visitas, gasto, última visita y cómo contactarlas.",
  },
  search: { label: "Buscar contactos", placeholder: "Buscar nombre, correo, teléfono, etiqueta…" },
  statusLabel: "Mostrar",
  status: { all: "Todos", vip: "VIP", blocked: "Bloqueados" },
  views: { label: "Vista del directorio", grid: "Tarjetas", table: "Tabla" },
  sort: {
    label: "Ordenar por",
    name: "Nombre (A–Z)",
    lastVisit: "Última visita",
    visits: "Más visitas",
    spend: "Mayor gasto",
  },
  export: "Exportar",
  empty: {
    noContactsTitle: "Todavía no hay contactos",
    noContacts: "Las personas que reserven contigo aparecerán aquí.",
    noMatchTitle: "No se encontraron contactos",
    noMatch: "Nada coincide con «{query}».",
    noMatchFilter: "Ningún contacto cumple este filtro.",
  },
  card: {
    visits: "Visitas",
    spend: "Gasto",
    lastVisit: "Última visita",
    never: "Aún sin visitas",
    vip: "VIP",
    blocked: "Bloqueado",
    email: "Enviar un correo a {name}",
    call: "Llamar a {name}",
  },
  table: { customer: "Nombre", visits: "Visitas", spend: "Gasto", lastVisit: "Última visita", contact: "Contacto" },
  csv: {
    name: "Nombre",
    email: "Correo",
    phone: "Teléfono",
    tags: "Etiquetas",
    vip: "VIP",
    blocked: "Bloqueado",
    visits: "Visitas",
    spend: "Gasto",
    currency: "Moneda",
    lastVisit: "Última visita",
    yes: "Sí",
    no: "No",
  },
  pager: { label: "Páginas", next: "Página siguiente", first: "Primera página" },
};

const de: CustomerDirectoryMessages = {
  meta: {
    title: "Kunden",
    description:
      "Alle, die bei dir gebucht haben, mit Besuchen, Ausgaben, letztem Besuch und einer Möglichkeit zur Kontaktaufnahme.",
  },
  search: { label: "Kontakte suchen", placeholder: "Name, E-Mail, Telefon, Tag suchen…" },
  statusLabel: "Anzeigen",
  status: { all: "Alle", vip: "VIP", blocked: "Gesperrt" },
  views: { label: "Ansicht des Verzeichnisses", grid: "Kacheln", table: "Tabelle" },
  sort: {
    label: "Sortieren nach",
    name: "Name (A–Z)",
    lastVisit: "Letzter Besuch",
    visits: "Meiste Besuche",
    spend: "Höchste Ausgaben",
  },
  export: "Exportieren",
  empty: {
    noContactsTitle: "Noch keine Kontakte",
    noContacts: "Wer bei dir bucht, erscheint hier.",
    noMatchTitle: "Keine Kontakte gefunden",
    noMatch: "Nichts passt zu „{query}“.",
    noMatchFilter: "Kein Kontakt passt zu diesem Filter.",
  },
  card: {
    visits: "Besuche",
    spend: "Ausgaben",
    lastVisit: "Letzter Besuch",
    never: "Noch kein Besuch",
    vip: "VIP",
    blocked: "Gesperrt",
    email: "E-Mail an {name} schreiben",
    call: "{name} anrufen",
  },
  table: { customer: "Name", visits: "Besuche", spend: "Ausgaben", lastVisit: "Letzter Besuch", contact: "Kontakt" },
  csv: {
    name: "Name",
    email: "E-Mail",
    phone: "Telefon",
    tags: "Tags",
    vip: "VIP",
    blocked: "Gesperrt",
    visits: "Besuche",
    spend: "Ausgaben",
    currency: "Währung",
    lastVisit: "Letzter Besuch",
    yes: "Ja",
    no: "Nein",
  },
  pager: { label: "Seiten", next: "Nächste Seite", first: "Erste Seite" },
};

const fr: CustomerDirectoryMessages = {
  meta: {
    title: "Clients",
    description:
      "Toutes les personnes qui ont réservé chez vous, avec visites, dépenses, dernière visite et un moyen de les joindre.",
  },
  search: { label: "Rechercher des contacts", placeholder: "Rechercher un nom, e-mail, téléphone, tag…" },
  statusLabel: "Afficher",
  status: { all: "Tous", vip: "VIP", blocked: "Bloqués" },
  views: { label: "Affichage du répertoire", grid: "Cartes", table: "Tableau" },
  sort: {
    label: "Trier par",
    name: "Nom (A–Z)",
    lastVisit: "Dernière visite",
    visits: "Plus de visites",
    spend: "Dépenses les plus élevées",
  },
  export: "Exporter",
  empty: {
    noContactsTitle: "Aucun contact pour le moment",
    noContacts: "Les personnes qui réservent chez vous apparaîtront ici.",
    noMatchTitle: "Aucun contact trouvé",
    noMatch: "Rien ne correspond à « {query} ».",
    noMatchFilter: "Aucun contact ne correspond à ce filtre.",
  },
  card: {
    visits: "Visites",
    spend: "Dépenses",
    lastVisit: "Dernière visite",
    never: "Aucune visite",
    vip: "VIP",
    blocked: "Bloqué",
    email: "Envoyer un e-mail à {name}",
    call: "Appeler {name}",
  },
  table: { customer: "Nom", visits: "Visites", spend: "Dépenses", lastVisit: "Dernière visite", contact: "Contact" },
  csv: {
    name: "Nom",
    email: "E-mail",
    phone: "Téléphone",
    tags: "Tags",
    vip: "VIP",
    blocked: "Bloqué",
    visits: "Visites",
    spend: "Dépenses",
    currency: "Devise",
    lastVisit: "Dernière visite",
    yes: "Oui",
    no: "Non",
  },
  pager: { label: "Pages", next: "Page suivante", first: "Première page" },
};

export const customerDirectoryMessages = defineMessages<CustomerDirectoryMessages>({ en, es, de, fr });

export const customerDirectoryBundle: MessageBundle<CustomerDirectoryMessages> = {
  key: customerDirectoryMessageKey,
  dictionary: customerDirectoryMessages,
};
