import "server-only";

import { defineMessages } from "@/core/i18n";

/** What an assistant asks for, one sentence per action; `{target}` is the id of the record, which may be empty. */
export interface ApprovalActionText {
  readonly bookingsCancel: string;
  readonly bookingsNoShowMark: string;
  readonly bookingsReschedule: string;
  readonly bookingsTableAssign: string;
  readonly customersBlock: string;
  readonly customersUnblock: string;
  readonly customersContactUpdate: string;
  readonly generic: string;
}

export interface ApprovalsMessages {
  /** The bell's row for a write that waits for a person (ADR 0017 "The bell"). */
  readonly bell: { readonly title: string; readonly body: ApprovalActionText };
  readonly settings: {
    readonly policy: { readonly label: string; readonly description: string };
  };
}

/** Default texts of the approvals kernel module: the bell's row for a waiting write, and the policy setting's label and description. */
export const approvalsMessages = defineMessages<ApprovalsMessages>({
  en: {
    bell: {
      title: "An assistant is waiting for your approval",
      body: {
        bookingsCancel: "An assistant asks to cancel booking {target}.",
        bookingsNoShowMark: "An assistant asks to mark booking {target} as a no-show.",
        bookingsReschedule: "An assistant asks to reschedule booking {target}.",
        bookingsTableAssign: "An assistant asks to change the resources of booking {target}.",
        customersBlock: "An assistant asks to block customer {target}.",
        customersUnblock: "An assistant asks to unblock customer {target}.",
        customersContactUpdate: "An assistant asks to change the contact details of customer {target}.",
        generic: "An assistant asks to make a change to {target}.",
      },
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
      body: {
        bookingsCancel: "Un asistente pide cancelar la reserva {target}.",
        bookingsNoShowMark: "Un asistente pide marcar la reserva {target} como no presentada.",
        bookingsReschedule: "Un asistente pide cambiar la hora de la reserva {target}.",
        bookingsTableAssign: "Un asistente pide cambiar los recursos de la reserva {target}.",
        customersBlock: "Un asistente pide bloquear al cliente {target}.",
        customersUnblock: "Un asistente pide desbloquear al cliente {target}.",
        customersContactUpdate: "Un asistente pide cambiar los datos de contacto del cliente {target}.",
        generic: "Un asistente pide hacer un cambio en {target}.",
      },
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
      body: {
        bookingsCancel: "Ein Assistent möchte die Buchung {target} stornieren.",
        bookingsNoShowMark: "Ein Assistent möchte die Buchung {target} als nicht erschienen markieren.",
        bookingsReschedule: "Ein Assistent möchte die Buchung {target} verschieben.",
        bookingsTableAssign: "Ein Assistent möchte die Ressourcen der Buchung {target} ändern.",
        customersBlock: "Ein Assistent möchte den Kunden {target} sperren.",
        customersUnblock: "Ein Assistent möchte die Sperre des Kunden {target} aufheben.",
        customersContactUpdate: "Ein Assistent möchte die Kontaktdaten des Kunden {target} ändern.",
        generic: "Ein Assistent möchte {target} ändern.",
      },
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
      body: {
        bookingsCancel: "Un assistant demande d’annuler la réservation {target}.",
        bookingsNoShowMark: "Un assistant demande de marquer la réservation {target} comme absente.",
        bookingsReschedule: "Un assistant demande de déplacer la réservation {target}.",
        bookingsTableAssign: "Un assistant demande de changer les ressources de la réservation {target}.",
        customersBlock: "Un assistant demande de bloquer le client {target}.",
        customersUnblock: "Un assistant demande de débloquer le client {target}.",
        customersContactUpdate: "Un assistant demande de modifier les coordonnées du client {target}.",
        generic: "Un assistant demande de modifier {target}.",
      },
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
