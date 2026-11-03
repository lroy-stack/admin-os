import { defineMessages, type Plural } from "@/core/i18n";

interface SettingText {
  readonly label: string;
  readonly description: string;
}

export interface BookingsMessages {
  readonly title: string;
  readonly count: Plural;
  readonly partySize: string;
  readonly settings: {
    readonly walkInStay: SettingText;
    readonly lateAfter: SettingText;
    readonly slot: SettingText;
  };
}

export const bookingsMessages = defineMessages<BookingsMessages>({
  en: {
    title: "Bookings",
    count: { one: "{count} booking", other: "{count} bookings" },
    partySize: "Party size",
    settings: {
      walkInStay: { label: "Walk-in stay", description: "Minutes a walk-in party is expected to stay." },
      lateAfter: {
        label: "Late after",
        description: "Minutes after the start time before a booking that has not arrived counts as late.",
      },
      slot: { label: "Time slot", description: "Length of one slot on the time rail, in minutes." },
    },
  },
  es: {
    title: "Reservas",
    count: { one: "{count} reserva", other: "{count} reservas" },
    partySize: "Personas",
    settings: {
      walkInStay: {
        label: "Estancia sin reserva",
        description: "Minutos que se espera que se quede un grupo sin reserva.",
      },
      lateAfter: {
        label: "Retraso a partir de",
        description: "Minutos tras la hora de inicio antes de que una reserva que no ha llegado cuente como tarde.",
      },
      slot: { label: "Franja horaria", description: "Duración de una franja en la línea de tiempo, en minutos." },
    },
  },
  de: {
    title: "Buchungen",
    count: { one: "{count} Buchung", other: "{count} Buchungen" },
    partySize: "Personenzahl",
    settings: {
      walkInStay: {
        label: "Aufenthalt ohne Reservierung",
        description: "Minuten, die eine Gruppe ohne Reservierung voraussichtlich bleibt.",
      },
      lateAfter: {
        label: "Verspätet ab",
        description: "Minuten nach der Startzeit, ab denen eine nicht erschienene Buchung als verspätet gilt.",
      },
      slot: { label: "Zeitraster", description: "Länge eines Zeitfensters in der Zeitleiste, in Minuten." },
    },
  },
  fr: {
    title: "Réservations",
    count: { one: "{count} réservation", other: "{count} réservations" },
    partySize: "Nombre de personnes",
    settings: {
      walkInStay: {
        label: "Durée sans réservation",
        description: "Minutes pendant lesquelles un groupe sans réservation doit rester.",
      },
      lateAfter: {
        label: "Retard après",
        description: "Minutes après l’heure de début avant qu’une réservation non arrivée soit en retard.",
      },
      slot: { label: "Créneau", description: "Durée d’un créneau sur la ligne de temps, en minutes." },
    },
  },
});
