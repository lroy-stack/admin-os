import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type FeedbackMessages, feedbackMessageKey } from "./messages";

const en: FeedbackMessages = {
  copy: { copied: "Copied", copiedLabel: "{label} copied", failed: "Could not copy. Copy it by hand." },
  undo: {
    action: "Undo",
    undone: "Undone",
    failed: "Could not undo. Try again.",
    countdown: { one: "{count} second left to undo", other: "{count} seconds left to undo" },
  },
};

const es: FeedbackMessages = {
  copy: { copied: "Copiado", copiedLabel: "{label} copiado", failed: "No se pudo copiar. Cópialo a mano." },
  undo: {
    action: "Deshacer",
    undone: "Deshecho",
    failed: "No se pudo deshacer. Inténtalo de nuevo.",
    countdown: { one: "Queda {count} segundo para deshacer", other: "Quedan {count} segundos para deshacer" },
  },
};

const de: FeedbackMessages = {
  copy: {
    copied: "Kopiert",
    copiedLabel: "{label} kopiert",
    failed: "Kopieren nicht möglich. Kopiere es von Hand.",
  },
  undo: {
    action: "Rückgängig",
    undone: "Rückgängig gemacht",
    failed: "Rückgängig nicht möglich. Bitte versuche es erneut.",
    countdown: {
      one: "Noch {count} Sekunde zum Rückgängigmachen",
      other: "Noch {count} Sekunden zum Rückgängigmachen",
    },
  },
};

const fr: FeedbackMessages = {
  copy: { copied: "Copié", copiedLabel: "{label} copié", failed: "Impossible de copier. Copiez à la main." },
  undo: {
    action: "Annuler",
    undone: "Annulé",
    failed: "Impossible d’annuler. Veuillez réessayer.",
    countdown: { one: "Encore {count} seconde pour annuler", other: "Encore {count} secondes pour annuler" },
  },
};

export const feedbackMessages = defineMessages<FeedbackMessages>({ en, es, de, fr });

/** Pass to `resolveMessages` (or `LocaleRoot bundles`) in the layout that mounts a screen using the feedback kit. */
export const feedbackBundle: MessageBundle<FeedbackMessages> = {
  key: feedbackMessageKey,
  dictionary: feedbackMessages,
};
