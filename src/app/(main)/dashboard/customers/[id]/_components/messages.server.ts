import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CustomerRecordMessages, customerRecordMessageKey } from "./messages";

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
  edit: {
    verb: "Edit contact",
    description: "Change how this customer can be reached. Clear a field to remove it.",
    saved: "Contact updated",
  },
  note: {
    verb: "Add note",
    description: "Your name and the time are saved with the note.",
    label: "Note",
    invalid: "Enter a note.",
    saved: "Note added",
  },
  block: {
    title: "Block customer",
    verb: "Block",
    description: "A blocked customer cannot be booked. Staff see the reason.",
    label: "Reason",
    invalid: "Enter a reason.",
    done: "{name} blocked",
  },
  unblock: {
    verb: "Unblock",
    done: "{name} unblocked. Undo blocks again for “{reason}”.",
    doneFinal: "{name} unblocked",
    failed: "Could not unblock. Try again.",
  },
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
  edit: {
    verb: "Editar contacto",
    description: "Cambia cómo se puede localizar a este cliente. Vacía un campo para quitarlo.",
    saved: "Contacto actualizado",
  },
  note: {
    verb: "Añadir nota",
    description: "Se guardan tu nombre y la hora con la nota.",
    label: "Nota",
    invalid: "Escribe una nota.",
    saved: "Nota añadida",
  },
  block: {
    title: "Bloquear cliente",
    verb: "Bloquear",
    description: "Un cliente bloqueado no puede reservar. El equipo ve el motivo.",
    label: "Motivo",
    invalid: "Escribe un motivo.",
    done: "Se ha bloqueado a {name}",
  },
  unblock: {
    verb: "Desbloquear",
    done: "Se ha desbloqueado a {name}. Deshacer lo bloquea de nuevo por «{reason}».",
    doneFinal: "Se ha desbloqueado a {name}",
    failed: "No se pudo desbloquear. Inténtalo de nuevo.",
  },
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
  edit: {
    verb: "Kontakt bearbeiten",
    description: "Ändere, wie dieser Kunde erreichbar ist. Leere ein Feld, um es zu entfernen.",
    saved: "Kontakt aktualisiert",
  },
  note: {
    verb: "Notiz hinzufügen",
    description: "Dein Name und die Uhrzeit werden mit der Notiz gespeichert.",
    label: "Notiz",
    invalid: "Gib eine Notiz ein.",
    saved: "Notiz hinzugefügt",
  },
  block: {
    title: "Kunde sperren",
    verb: "Sperren",
    description: "Ein gesperrter Kunde kann nicht gebucht werden. Das Team sieht den Grund.",
    label: "Grund",
    invalid: "Gib einen Grund ein.",
    done: "{name} gesperrt",
  },
  unblock: {
    verb: "Entsperren",
    done: "{name} entsperrt. Rückgängig sperrt wieder wegen „{reason}“.",
    doneFinal: "{name} entsperrt",
    failed: "Entsperren fehlgeschlagen. Versuche es erneut.",
  },
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
  edit: {
    verb: "Modifier le contact",
    description: "Modifiez la façon de joindre ce client. Videz un champ pour le retirer.",
    saved: "Contact mis à jour",
  },
  note: {
    verb: "Ajouter une note",
    description: "Votre nom et l’heure sont enregistrés avec la note.",
    label: "Note",
    invalid: "Saisissez une note.",
    saved: "Note ajoutée",
  },
  block: {
    title: "Bloquer le client",
    verb: "Bloquer",
    description: "Un client bloqué ne peut pas réserver. L’équipe voit le motif.",
    label: "Motif",
    invalid: "Saisissez un motif.",
    done: "Blocage appliqué à {name}",
  },
  unblock: {
    verb: "Débloquer",
    done: "Blocage levé pour {name}. Annuler le rétablit pour «\u00a0{reason}\u00a0».",
    doneFinal: "Blocage levé pour {name}",
    failed: "Impossible de débloquer. Réessayez.",
  },
};

export const customerRecordMessages = defineMessages<CustomerRecordMessages>({ en, es, de, fr });

export const customerRecordBundle: MessageBundle<CustomerRecordMessages> = {
  key: customerRecordMessageKey,
  dictionary: customerRecordMessages,
};
