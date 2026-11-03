import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type OverlaysMessages, overlaysMessageKey } from "./messages";

const en: OverlaysMessages = {
  confirm: {
    cancel: "Cancel",
    pending: "Working",
    reasonRequired: "A reason is required to continue.",
    failed: "Could not complete this. Try again.",
    invalid: "Check the details and try again.",
  },
  discard: {
    title: "Discard changes?",
    consequence: "Your changes will be lost.",
    keep: "Keep editing",
    discard: "Discard",
  },
  window: { close: "Close", demoNote: "Demo data, not saved" },
};

const es: OverlaysMessages = {
  confirm: {
    cancel: "Cancelar",
    pending: "En curso",
    reasonRequired: "Hace falta un motivo para continuar.",
    failed: "No se pudo completar. Inténtalo de nuevo.",
    invalid: "Revisa los datos e inténtalo de nuevo.",
  },
  discard: {
    title: "¿Descartar los cambios?",
    consequence: "Se perderán tus cambios.",
    keep: "Seguir editando",
    discard: "Descartar",
  },
  window: { close: "Cerrar", demoNote: "Datos de demostración, no se guardan" },
};

const de: OverlaysMessages = {
  confirm: {
    cancel: "Abbrechen",
    pending: "Wird ausgeführt",
    reasonRequired: "Zum Fortfahren ist ein Grund erforderlich.",
    failed: "Das hat nicht geklappt. Bitte versuche es erneut.",
    invalid: "Prüfe die Angaben und versuche es erneut.",
  },
  discard: {
    title: "Änderungen verwerfen?",
    consequence: "Deine Änderungen gehen verloren.",
    keep: "Weiter bearbeiten",
    discard: "Verwerfen",
  },
  window: { close: "Schließen", demoNote: "Demodaten, nicht gespeichert" },
};

const fr: OverlaysMessages = {
  confirm: {
    cancel: "Annuler",
    pending: "En cours",
    reasonRequired: "Un motif est requis pour continuer.",
    failed: "Impossible de terminer. Veuillez réessayer.",
    invalid: "Vérifiez les informations et réessayez.",
  },
  discard: {
    title: "Abandonner les modifications ?",
    consequence: "Vos modifications seront perdues.",
    keep: "Continuer la saisie",
    discard: "Abandonner",
  },
  window: { close: "Fermer", demoNote: "Données de démonstration, non enregistrées" },
};

export const overlaysMessages = defineMessages<OverlaysMessages>({ en, es, de, fr });

/** Pass to `LocaleRoot bundles` in the layout that mounts a screen using the window kit. */
export const overlaysBundle: MessageBundle<OverlaysMessages> = {
  key: overlaysMessageKey,
  dictionary: overlaysMessages,
};
