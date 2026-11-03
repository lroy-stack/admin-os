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
  newContact: {
    verb: "Add contact",
    description: "Add someone to your directory. A phone or an email helps you recognise them later.",
    added: "Contact added: {name}",
    duplicate: {
      title: "A contact with this phone or email already exists.",
      show: "Show {name}",
      reason: { phone: "Same phone", email: "Same email", both: "Same phone and email" },
    },
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
  newContact: {
    verb: "Añadir contacto",
    description: "Añade a alguien a tu directorio. Un teléfono o un correo te ayuda a reconocerlo después.",
    added: "Contacto añadido: {name}",
    duplicate: {
      title: "Ya existe un contacto con este teléfono o correo.",
      show: "Ver a {name}",
      reason: { phone: "Mismo teléfono", email: "Mismo correo", both: "Mismo teléfono y correo" },
    },
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
  newContact: {
    verb: "Kontakt hinzufügen",
    description:
      "Füge jemanden zu deinem Verzeichnis hinzu. Mit Telefonnummer oder E-Mail erkennst du die Person später wieder.",
    added: "Kontakt hinzugefügt: {name}",
    duplicate: {
      title: "Ein Kontakt mit dieser Telefonnummer oder E-Mail-Adresse existiert bereits.",
      show: "{name} anzeigen",
      reason: {
        phone: "Gleiche Telefonnummer",
        email: "Gleiche E-Mail-Adresse",
        both: "Gleiche Telefonnummer und E-Mail-Adresse",
      },
    },
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
  newContact: {
    verb: "Ajouter un contact",
    description: "Ajoutez quelqu’un à votre répertoire. Un téléphone ou un e-mail vous aide à le reconnaître ensuite.",
    added: "Contact ajouté : {name}",
    duplicate: {
      title: "Un contact avec ce téléphone ou cet e-mail existe déjà.",
      show: "Afficher {name}",
      reason: { phone: "Même téléphone", email: "Même e-mail", both: "Même téléphone et même e-mail" },
    },
  },
  pager: { label: "Pages", next: "Page suivante", first: "Première page" },
};

export const customerDirectoryMessages = defineMessages<CustomerDirectoryMessages>({ en, es, de, fr });

export const customerDirectoryBundle: MessageBundle<CustomerDirectoryMessages> = {
  key: customerDirectoryMessageKey,
  dictionary: customerDirectoryMessages,
};
