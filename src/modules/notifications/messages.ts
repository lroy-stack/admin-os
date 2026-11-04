import { defineMessages } from "@/core/i18n";

interface KindText {
  readonly title: string;
  readonly body: string;
}

/** What an assistant asks for, one sentence per action; `{target}` is the id of the record, which may be empty. */
interface ApprovalActionText {
  readonly bookingsCancel: string;
  readonly bookingsNoShowMark: string;
  readonly bookingsReschedule: string;
  readonly bookingsTableAssign: string;
  readonly customersBlock: string;
  readonly customersUnblock: string;
  readonly customersContactUpdate: string;
  readonly generic: string;
}

interface SettingText {
  readonly label: string;
  readonly description: string;
}

/** Placeholders: `{name}`, `{time}` (HH:mm), `{partySize}` and, for soon and late, `{minutes}`; for a waiting write, `{capability}` and `{target}`. */
export interface NotificationsMessages {
  readonly title: string;
  readonly kinds: {
    readonly bookingSoon: KindText;
    readonly bookingLate: KindText;
    readonly bookingNew: KindText;
    readonly approvalRequested: { readonly title: string; readonly body: ApprovalActionText };
  };
  readonly settings: { readonly bookingSoon: SettingText };
}

export const notificationsMessages = defineMessages<NotificationsMessages>({
  en: {
    title: "Notifications",
    kinds: {
      bookingSoon: {
        title: "Arriving soon at {time}",
        body: "{name}, party of {partySize}, is due in {minutes} min.",
      },
      bookingLate: {
        title: "Late arrival",
        body: "{name}, party of {partySize}, was due at {time}, {minutes} min ago.",
      },
      bookingNew: { title: "New booking", body: "{name}, party of {partySize}, at {time}." },
      approvalRequested: {
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
    },
    settings: {
      bookingSoon: {
        label: "Arriving-soon alert",
        description: "Minutes before the start from which a booking that has not arrived is announced.",
      },
    },
  },
  es: {
    title: "Notificaciones",
    kinds: {
      bookingSoon: {
        title: "Llega pronto a las {time}",
        body: "{name}, {partySize} personas, llega en {minutes} min.",
      },
      bookingLate: {
        title: "Llegada con retraso",
        body: "{name}, {partySize} personas, tenía hora a las {time}, hace {minutes} min.",
      },
      bookingNew: { title: "Nueva reserva", body: "{name}, {partySize} personas, a las {time}." },
      approvalRequested: {
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
    },
    settings: {
      bookingSoon: {
        label: "Aviso de llegada próxima",
        description: "Minutos antes de la hora de inicio desde los que se avisa de una reserva que aún no ha llegado.",
      },
    },
  },
  de: {
    title: "Benachrichtigungen",
    kinds: {
      bookingSoon: {
        title: "Kommt bald um {time}",
        body: "{name}, {partySize} Personen, wird in {minutes} Min. erwartet.",
      },
      bookingLate: {
        title: "Verspätete Ankunft",
        body: "{name}, {partySize} Personen, wurde um {time} erwartet, vor {minutes} Min.",
      },
      bookingNew: { title: "Neue Buchung", body: "{name}, {partySize} Personen, um {time}." },
      approvalRequested: {
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
    },
    settings: {
      bookingSoon: {
        label: "Hinweis auf baldige Ankunft",
        description: "Minuten vor dem Beginn, ab denen eine noch nicht eingetroffene Buchung angekündigt wird.",
      },
    },
  },
  fr: {
    title: "Notifications",
    kinds: {
      bookingSoon: {
        title: "Arrivée imminente à {time}",
        body: "{name}, {partySize} personnes, est attendu dans {minutes} min.",
      },
      bookingLate: {
        title: "Arrivée en retard",
        body: "{name}, {partySize} personnes, était attendu à {time}, il y a {minutes} min.",
      },
      bookingNew: { title: "Nouvelle réservation", body: "{name}, {partySize} personnes, à {time}." },
      approvalRequested: {
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
    },
    settings: {
      bookingSoon: {
        label: "Alerte d’arrivée imminente",
        description: "Minutes avant l’heure de début à partir desquelles une réservation non arrivée est signalée.",
      },
    },
  },
});
