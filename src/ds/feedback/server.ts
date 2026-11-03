import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type FeedbackMessages, feedbackMessageKey } from "./messages";

const en: FeedbackMessages = {
  copy: { copied: "Copied", copiedLabel: "{label} copied", failed: "Could not copy. Copy it by hand." },
};

const es: FeedbackMessages = {
  copy: { copied: "Copiado", copiedLabel: "{label} copiado", failed: "No se pudo copiar. Cópialo a mano." },
};

const de: FeedbackMessages = {
  copy: {
    copied: "Kopiert",
    copiedLabel: "{label} kopiert",
    failed: "Kopieren nicht möglich. Kopiere es von Hand.",
  },
};

const fr: FeedbackMessages = {
  copy: { copied: "Copié", copiedLabel: "{label} copié", failed: "Impossible de copier. Copiez à la main." },
};

export const feedbackMessages = defineMessages<FeedbackMessages>({ en, es, de, fr });

/** Pass to `resolveMessages` (or `LocaleRoot bundles`) in the layout that mounts a screen using the feedback kit. */
export const feedbackBundle: MessageBundle<FeedbackMessages> = {
  key: feedbackMessageKey,
  dictionary: feedbackMessages,
};
