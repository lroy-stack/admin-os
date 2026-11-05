import { defineMessages } from "@/core/i18n";

interface KindText {
  readonly title: string;
  readonly body: string;
}

interface SettingText {
  readonly label: string;
  readonly description: string;
}

/** Placeholders: `{name}`, `{time}` (HH:mm) and `{partySize}`, and `{minutes}` for soon and late. */
export interface NotificationsMessages {
  readonly title: string;
  readonly kinds: {
    readonly bookingSoon: KindText;
    readonly bookingLate: KindText;
    readonly bookingNew: KindText;
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
    },
    settings: {
      bookingSoon: {
        label: "Alerte d’arrivée imminente",
        description: "Minutes avant l’heure de début à partir desquelles une réservation non arrivée est signalée.",
      },
    },
  },
});
