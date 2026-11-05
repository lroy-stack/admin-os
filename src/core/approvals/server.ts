import "server-only";

import { defineMessages } from "@/core/i18n";

export interface ApprovalsMessages {
  /** The bell's row for a write that waits for a person (ADR 0017 "The bell"). */
  readonly bell: {
    readonly title: string;
    /** The sentence for a write no module words; `{target}` is the id of the record, which may be empty. */
    readonly generic: string;
  };
  readonly settings: {
    readonly policy: { readonly label: string; readonly description: string };
  };
}

/** Default texts of the approvals kernel module: the bell's row for a waiting write, and the policy setting's label and description. */
export const approvalsMessages = defineMessages<ApprovalsMessages>({
  en: {
    bell: {
      title: "An assistant is waiting for your approval",
      generic: "An assistant asks to make a change to {target}.",
    },
    settings: {
      policy: {
        label: "Assistant approvals",
        description:
          "Which writes an assistant asks for wait for a person to approve them: all, only destructive and sensitive ones, or none.",
      },
    },
  },
  es: {
    bell: {
      title: "Un asistente espera tu aprobación",
      generic: "Un asistente pide hacer un cambio en {target}.",
    },
    settings: {
      policy: {
        label: "Aprobaciones del asistente",
        description:
          "Qué escrituras que pide un asistente esperan a que una persona las apruebe: todas, solo las destructivas y sensibles, o ninguna.",
      },
    },
  },
  de: {
    bell: {
      title: "Ein Assistent wartet auf Ihre Genehmigung",
      generic: "Ein Assistent möchte {target} ändern.",
    },
    settings: {
      policy: {
        label: "Genehmigungen für Assistenten",
        description:
          "Welche Schreibvorgänge eines Assistenten auf die Genehmigung einer Person warten: alle, nur zerstörerische und sensible oder keine.",
      },
    },
  },
  fr: {
    bell: {
      title: "Un assistant attend votre approbation",
      generic: "Un assistant demande de modifier {target}.",
    },
    settings: {
      policy: {
        label: "Approbations de l’assistant",
        description:
          "Quelles écritures demandées par un assistant attendent l’approbation d’une personne : toutes, seulement les destructives et sensibles, ou aucune.",
      },
    },
  },
});
