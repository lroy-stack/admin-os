import "server-only";

import { defineMessages } from "@/core/i18n";

import type { CustomerRecordMessages } from "./messages";

const en: CustomerRecordMessages = {
  meta: {
    title: "Customer",
    description: "A customer's visits, spend, notes and contact details.",
  },
  breadcrumb: { label: "Breadcrumb" },
  tabs: { overview: "Overview", notes: "Notes", contact: "Contact" },
  common: { yes: "Yes", no: "No", notGiven: "Not given" },
  header: {
    attendance: {
      one: "Kept {kept} of {count} booked visit",
      other: "Kept {kept} of {count} booked visits",
    },
    blockedReason: "Reason: {reason}",
  },
  overview: {
    noShows: "No-shows",
    preferences: "Preferences",
    marketing: "Marketing messages",
    language: "Language",
  },
  state: {
    title: "Status",
    active: "Active",
  },
  notes: {
    emptyTitle: "No notes yet",
    emptyDescription: "Notes your team writes about this customer will appear here.",
    byline: "{name} · {when}",
  },
  contact: { name: "Name", email: "Email", phone: "Phone", language: "Language" },
};

const es: CustomerRecordMessages = {
  meta: {
    title: "Cliente",
    description: "Las visitas, el gasto, las notas y los datos de contacto de un cliente.",
  },
  breadcrumb: { label: "Ruta de navegación" },
  tabs: { overview: "Resumen", notes: "Notas", contact: "Contacto" },
  common: { yes: "Sí", no: "No", notGiven: "Sin indicar" },
  header: {
    attendance: {
      one: "Acudió a {kept} de {count} visita reservada",
      other: "Acudió a {kept} de {count} visitas reservadas",
    },
    blockedReason: "Motivo: {reason}",
  },
  overview: {
    noShows: "No presentadas",
    preferences: "Preferencias",
    marketing: "Mensajes comerciales",
    language: "Idioma",
  },
  state: {
    title: "Estado",
    active: "Activo",
  },
  notes: {
    emptyTitle: "Todavía no hay notas",
    emptyDescription: "Las notas que tu equipo escriba sobre este cliente aparecerán aquí.",
    byline: "{name} · {when}",
  },
  contact: { name: "Nombre", email: "Correo", phone: "Teléfono", language: "Idioma" },
};

const de: CustomerRecordMessages = {
  meta: {
    title: "Kunde",
    description: "Besuche, Umsatz, Notizen und Kontaktdaten eines Kunden.",
  },
  breadcrumb: { label: "Brotkrümelnavigation" },
  tabs: { overview: "Übersicht", notes: "Notizen", contact: "Kontakt" },
  common: { yes: "Ja", no: "Nein", notGiven: "Nicht angegeben" },
  header: {
    attendance: {
      one: "{kept} von {count} gebuchtem Besuch wahrgenommen",
      other: "{kept} von {count} gebuchten Besuchen wahrgenommen",
    },
    blockedReason: "Grund: {reason}",
  },
  overview: {
    noShows: "Nicht erschienen",
    preferences: "Einstellungen",
    marketing: "Werbenachrichten",
    language: "Sprache",
  },
  state: {
    title: "Status",
    active: "Aktiv",
  },
  notes: {
    emptyTitle: "Noch keine Notizen",
    emptyDescription: "Notizen deines Teams zu diesem Kunden erscheinen hier.",
    byline: "{name} · {when}",
  },
  contact: { name: "Name", email: "E-Mail", phone: "Telefon", language: "Sprache" },
};

const fr: CustomerRecordMessages = {
  meta: {
    title: "Client",
    description: "Les visites, les dépenses, les notes et les coordonnées d’un client.",
  },
  breadcrumb: { label: "Fil d’Ariane" },
  tabs: { overview: "Aperçu", notes: "Notes", contact: "Contact" },
  common: { yes: "Oui", no: "Non", notGiven: "Non renseigné" },
  header: {
    attendance: {
      one: "{kept} sur {count} visite réservée honorée",
      other: "{kept} sur {count} visites réservées honorées",
    },
    blockedReason: "Motif : {reason}",
  },
  overview: {
    noShows: "Non honorées",
    preferences: "Préférences",
    marketing: "Messages commerciaux",
    language: "Langue",
  },
  state: {
    title: "Statut",
    active: "Actif",
  },
  notes: {
    emptyTitle: "Pas encore de notes",
    emptyDescription: "Les notes de votre équipe sur ce client apparaîtront ici.",
    byline: "{name} · {when}",
  },
  contact: { name: "Nom", email: "E-mail", phone: "Téléphone", language: "Langue" },
};

export const customerRecordMessages = defineMessages<CustomerRecordMessages>({ en, es, de, fr });
