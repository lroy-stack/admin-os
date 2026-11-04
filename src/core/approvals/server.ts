import "server-only";

import { defineMessages } from "@/core/i18n";

export interface ApprovalsMessages {
  readonly settings: {
    readonly policy: { readonly label: string; readonly description: string };
  };
}

/** Default texts of the approvals kernel module; the policy setting's label and description. */
export const approvalsMessages = defineMessages<ApprovalsMessages>({
  en: {
    settings: {
      policy: {
        label: "Assistant approvals",
        description:
          "Which writes an assistant asks for wait for a person to approve them: all, only destructive and sensitive ones, or none.",
      },
    },
  },
  es: {
    settings: {
      policy: {
        label: "Aprobaciones del asistente",
        description:
          "Qué escrituras que pide un asistente esperan a que una persona las apruebe: todas, solo las destructivas y sensibles, o ninguna.",
      },
    },
  },
  de: {
    settings: {
      policy: {
        label: "Genehmigungen für Assistenten",
        description:
          "Welche Schreibvorgänge eines Assistenten auf die Genehmigung einer Person warten: alle, nur zerstörerische und sensible oder keine.",
      },
    },
  },
  fr: {
    settings: {
      policy: {
        label: "Approbations de l’assistant",
        description:
          "Quelles écritures demandées par un assistant attendent l’approbation d’une personne : toutes, seulement les destructives et sensibles, ou aucune.",
      },
    },
  },
});
