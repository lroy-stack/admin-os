import { defineMessages, type ErrorMessages, type Plural } from "@/core/i18n";

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
    readonly serviceWindow: SettingText;
    readonly walkInUndo: SettingText;
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
      serviceWindow: {
        label: "Service hours",
        description: "The hours of the day when bookings can start, as minutes from midnight.",
      },
      walkInUndo: {
        label: "Undo window",
        description: "Seconds during which a seated walk-in or a status step can still be taken back.",
      },
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
      serviceWindow: {
        label: "Horario de servicio",
        description: "Las horas del día en que pueden empezar las reservas, en minutos desde medianoche.",
      },
      walkInUndo: {
        label: "Plazo para deshacer",
        description:
          "Segundos durante los que se puede deshacer un grupo sin reserva recién sentado o un cambio de estado.",
      },
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
      serviceWindow: {
        label: "Servicezeiten",
        description: "Die Tageszeiten, zu denen Buchungen beginnen können, in Minuten ab Mitternacht.",
      },
      walkInUndo: {
        label: "Rückgängig-Frist",
        description:
          "Sekunden, in denen eine gerade platzierte Gruppe ohne Reservierung oder ein Statuswechsel noch zurückgenommen werden kann.",
      },
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
      serviceWindow: {
        label: "Heures de service",
        description: "Les heures de la journée où les réservations peuvent commencer, en minutes depuis minuit.",
      },
      walkInUndo: {
        label: "Délai d’annulation",
        description:
          "Secondes pendant lesquelles un groupe sans réservation tout juste installé ou un changement de statut peut encore être annulé.",
      },
    },
  },
});

/** Texts for the module's own error codes, in the shape `errorText` takes; other codes fall back to their class. */
export const bookingsErrors = defineMessages<ErrorMessages>({
  en: {
    "bookings.not_found": "This booking, place or contact no longer exists.",
    "bookings.not_enough_seats": "The chosen places do not seat the whole party. Pick more seats or a bigger place.",
    "bookings.resource_busy": "One of the chosen places is already booked for that time. Pick another place or time.",
    "bookings.resource_inactive": "One of the chosen places is not in use.",
    "bookings.outside_window": "That time is outside the service hours.",
    "bookings.off_grid": "Pick a time on the booking grid.",
    "bookings.start_passed": "That time has already passed. Pick a time from now on.",
    "bookings.invalid_transition": "This booking cannot move to that step from where it is.",
    "bookings.closed": "This booking is finished and can no longer be changed.",
    "bookings.staff_note_full": "The staff note of this booking is full. Shorten it before adding more.",
    "bookings.too_early": "It is too soon to mark this booking as a no-show.",
    "bookings.not_walk_in": "Only a walk-in can be taken back this way.",
    "bookings.undo_expired": "It is too late to undo this walk-in.",
    "bookings.status_undo_expired": "It is too late to undo this step.",
  },
  es: {
    "bookings.not_found": "Esta reserva, este puesto o este contacto ya no existe.",
    "bookings.not_enough_seats":
      "Los puestos elegidos no tienen sitio para todo el grupo. Elige más plazas o un puesto mayor.",
    "bookings.resource_busy":
      "Uno de los puestos elegidos ya está reservado a esa hora. Elige otro puesto u otra hora.",
    "bookings.resource_inactive": "Uno de los puestos elegidos no está en uso.",
    "bookings.outside_window": "Esa hora queda fuera del horario de servicio.",
    "bookings.off_grid": "Elige una hora de la cuadrícula de reservas.",
    "bookings.start_passed": "Esa hora ya ha pasado. Elige una hora a partir de ahora.",
    "bookings.invalid_transition": "Esta reserva no puede pasar a ese paso desde donde está.",
    "bookings.closed": "Esta reserva ha terminado y ya no se puede modificar.",
    "bookings.staff_note_full": "La nota del personal de esta reserva está llena. Acórtala antes de añadir más.",
    "bookings.too_early": "Todavía es pronto para marcar esta reserva como no presentada.",
    "bookings.not_walk_in": "Solo se puede deshacer así un grupo sin reserva.",
    "bookings.undo_expired": "Es demasiado tarde para deshacer este grupo sin reserva.",
    "bookings.status_undo_expired": "Es demasiado tarde para deshacer este paso.",
  },
  de: {
    "bookings.not_found": "Diese Buchung, dieser Platz oder dieser Kontakt existiert nicht mehr.",
    "bookings.not_enough_seats":
      "Die gewählten Plätze bieten nicht für die ganze Gruppe Raum. Wähle mehr Sitzplätze oder einen größeren Platz.",
    "bookings.resource_busy":
      "Einer der gewählten Plätze ist zu dieser Zeit schon vergeben. Wähle einen anderen Platz oder eine andere Zeit.",
    "bookings.resource_inactive": "Einer der gewählten Plätze ist nicht in Betrieb.",
    "bookings.outside_window": "Diese Zeit liegt außerhalb der Servicezeiten.",
    "bookings.off_grid": "Wähle eine Zeit aus dem Buchungsraster.",
    "bookings.start_passed": "Diese Zeit ist schon vorbei. Wähle eine Zeit ab jetzt.",
    "bookings.invalid_transition": "Diese Buchung kann von ihrem jetzigen Stand nicht zu diesem Schritt wechseln.",
    "bookings.closed": "Diese Buchung ist abgeschlossen und kann nicht mehr geändert werden.",
    "bookings.staff_note_full": "Die Teamnotiz dieser Buchung ist voll. Kürze sie, bevor du mehr hinzufügst.",
    "bookings.too_early": "Es ist noch zu früh, diese Buchung als nicht erschienen zu markieren.",
    "bookings.not_walk_in": "Nur eine Gruppe ohne Reservierung kann so zurückgenommen werden.",
    "bookings.undo_expired": "Es ist zu spät, diese Gruppe ohne Reservierung zurückzunehmen.",
    "bookings.status_undo_expired": "Es ist zu spät, diesen Schritt zurückzunehmen.",
  },
  fr: {
    "bookings.not_found": "Cette réservation, cet emplacement ou ce contact n’existe plus.",
    "bookings.not_enough_seats":
      "Les emplacements choisis ne peuvent pas accueillir tout le groupe. Choisissez plus de places ou un emplacement plus grand.",
    "bookings.resource_busy":
      "Un des emplacements choisis est déjà réservé à cette heure. Choisissez un autre emplacement ou une autre heure.",
    "bookings.resource_inactive": "Un des emplacements choisis n’est pas utilisé.",
    "bookings.outside_window": "Cette heure est en dehors des heures de service.",
    "bookings.off_grid": "Choisissez une heure de la grille de réservation.",
    "bookings.start_passed": "Cette heure est déjà passée. Choisissez une heure à partir de maintenant.",
    "bookings.invalid_transition": "Cette réservation ne peut pas passer à cette étape depuis son état actuel.",
    "bookings.closed": "Cette réservation est terminée et ne peut plus être modifiée.",
    "bookings.staff_note_full": "La note interne de cette réservation est pleine. Raccourcissez-la avant d’en ajouter.",
    "bookings.too_early": "Il est trop tôt pour marquer cette réservation comme absente.",
    "bookings.not_walk_in": "Seul un groupe sans réservation peut être annulé ainsi.",
    "bookings.undo_expired": "Il est trop tard pour annuler ce groupe sans réservation.",
    "bookings.status_undo_expired": "Il est trop tard pour annuler cette étape.",
  },
});

/** What an assistant asks for when it holds a write of the module (ADR 0017 "The bell"); `{target}` is the booking id. */
export const bookingsApprovals = defineMessages<Readonly<Record<string, string>>>({
  en: {
    "bookings.cancel": "An assistant asks to cancel booking {target}.",
    "bookings.no_show.mark": "An assistant asks to mark booking {target} as a no-show.",
    "bookings.reschedule": "An assistant asks to reschedule booking {target}.",
    "bookings.table.assign": "An assistant asks to change the resources of booking {target}.",
  },
  es: {
    "bookings.cancel": "Un asistente pide cancelar la reserva {target}.",
    "bookings.no_show.mark": "Un asistente pide marcar la reserva {target} como no presentada.",
    "bookings.reschedule": "Un asistente pide cambiar la hora de la reserva {target}.",
    "bookings.table.assign": "Un asistente pide cambiar los recursos de la reserva {target}.",
  },
  de: {
    "bookings.cancel": "Ein Assistent möchte die Buchung {target} stornieren.",
    "bookings.no_show.mark": "Ein Assistent möchte die Buchung {target} als nicht erschienen markieren.",
    "bookings.reschedule": "Ein Assistent möchte die Buchung {target} verschieben.",
    "bookings.table.assign": "Ein Assistent möchte die Ressourcen der Buchung {target} ändern.",
  },
  fr: {
    "bookings.cancel": "Un assistant demande d’annuler la réservation {target}.",
    "bookings.no_show.mark": "Un assistant demande de marquer la réservation {target} comme absente.",
    "bookings.reschedule": "Un assistant demande de déplacer la réservation {target}.",
    "bookings.table.assign": "Un assistant demande de changer les ressources de la réservation {target}.",
  },
});
