import { defineMessages, type Plural } from "@/core/i18n";

export interface BookingsMessages {
  readonly title: string;
  readonly count: Plural;
  readonly partySize: string;
}

export const bookingsMessages = defineMessages<BookingsMessages>({
  en: {
    title: "Bookings",
    count: { one: "{count} booking", other: "{count} bookings" },
    partySize: "Party size",
  },
  es: {
    title: "Reservas",
    count: { one: "{count} reserva", other: "{count} reservas" },
    partySize: "Personas",
  },
  de: {
    title: "Buchungen",
    count: { one: "{count} Buchung", other: "{count} Buchungen" },
    partySize: "Personenzahl",
  },
  fr: {
    title: "Réservations",
    count: { one: "{count} réservation", other: "{count} réservations" },
    partySize: "Nombre de personnes",
  },
});
