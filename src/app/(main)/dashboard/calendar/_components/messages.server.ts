import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CalendarMessages, calendarMessageKey } from "./messages";

const en: CalendarMessages = {
  meta: {
    title: "Team Schedule",
    description: "Meetings, focus time and all-day events alongside the deals closing in the next 30 days.",
  },
  title: "Team Schedule",
  kpis: {
    eventsInDays: { one: "Events in {count} day", other: "Events in {count} days" },
    booked: "Booked in meetings",
    focus: "Protected focus time",
    hours: "{hours} h",
  },
  stepper: { label: "Change period", previous: "Previous period", today: "Today", next: "Next period" },
  filter: {
    label: "Calendar",
    all: "All calendars",
    work: "Work",
    personal: "Personal",
    team: "Team",
    focus: "Focus time",
  },
  views: { label: "Calendar view", month: "Month", week: "Week", day: "Day" },
  addEvent: "Add event",
  sidebar: {
    upNext: "Up next",
    nothingScheduled: "Nothing else scheduled this month.",
    allDay: "All day",
    timeRange: "{start} – {end}",
    closingSoon: "Closing soon",
    openPipeline: "Open pipeline",
  },
  demoEvents: {
    monthlyPlanning: "Monthly planning",
    designReview: "Design review",
    clientCheckIn: "Client check-in",
    productWorkshop: "Product workshop",
    standup: "Team standup",
    financeSync: "Finance sync",
    focusBlock: "Focus block",
    sprintPlanning: "Sprint planning",
    opsHandoff: "Ops handoff",
    quarterlyReport: "Quarterly report due",
    resetDay: "Reset day",
    birthday: "{name}’s Birthday",
  },
};

const es: CalendarMessages = {
  meta: {
    title: "Agenda del equipo",
    description:
      "Reuniones, tiempo de concentración y eventos de todo el día junto a las oportunidades que cierran en los próximos 30 días.",
  },
  title: "Agenda del equipo",
  kpis: {
    eventsInDays: { one: "Eventos en {count} día", other: "Eventos en {count} días" },
    booked: "En reuniones",
    focus: "Tiempo de concentración protegido",
    hours: "{hours} h",
  },
  stepper: { label: "Cambiar periodo", previous: "Periodo anterior", today: "Hoy", next: "Periodo siguiente" },
  filter: {
    label: "Calendario",
    all: "Todos los calendarios",
    work: "Trabajo",
    personal: "Personal",
    team: "Equipo",
    focus: "Concentración",
  },
  views: { label: "Vista del calendario", month: "Mes", week: "Semana", day: "Día" },
  addEvent: "Añadir evento",
  sidebar: {
    upNext: "Próximos",
    nothingScheduled: "No hay nada más programado este mes.",
    allDay: "Todo el día",
    timeRange: "{start} – {end}",
    closingSoon: "Próximos cierres",
    openPipeline: "Abrir embudo",
  },
  demoEvents: {
    monthlyPlanning: "Planificación mensual",
    designReview: "Revisión de diseño",
    clientCheckIn: "Seguimiento con cliente",
    productWorkshop: "Taller de producto",
    standup: "Reunión diaria del equipo",
    financeSync: "Sincronización de finanzas",
    focusBlock: "Bloque de concentración",
    sprintPlanning: "Planificación del sprint",
    opsHandoff: "Traspaso de operaciones",
    quarterlyReport: "Entrega del informe trimestral",
    resetDay: "Día de pausa",
    birthday: "Cumpleaños de {name}",
  },
};

const de: CalendarMessages = {
  meta: {
    title: "Teamkalender",
    description:
      "Meetings, Fokuszeit und ganztägige Termine neben den Deals, die in den nächsten 30 Tagen abgeschlossen werden.",
  },
  title: "Teamkalender",
  kpis: {
    eventsInDays: { one: "Termine in {count} Tag", other: "Termine in {count} Tagen" },
    booked: "In Meetings gebucht",
    focus: "Geschützte Fokuszeit",
    hours: "{hours} h",
  },
  stepper: { label: "Zeitraum wechseln", previous: "Vorheriger Zeitraum", today: "Heute", next: "Nächster Zeitraum" },
  filter: {
    label: "Kalender",
    all: "Alle Kalender",
    work: "Arbeit",
    personal: "Privat",
    team: "Team",
    focus: "Fokuszeit",
  },
  views: { label: "Kalenderansicht", month: "Monat", week: "Woche", day: "Tag" },
  addEvent: "Termin hinzufügen",
  sidebar: {
    upNext: "Als Nächstes",
    nothingScheduled: "In diesem Monat steht nichts mehr an.",
    allDay: "Ganztägig",
    timeRange: "{start} – {end}",
    closingSoon: "Abschluss in Kürze",
    openPipeline: "Pipeline öffnen",
  },
  demoEvents: {
    monthlyPlanning: "Monatsplanung",
    designReview: "Design-Review",
    clientCheckIn: "Kundenabstimmung",
    productWorkshop: "Produkt-Workshop",
    standup: "Team-Standup",
    financeSync: "Finanz-Abstimmung",
    focusBlock: "Fokusblock",
    sprintPlanning: "Sprint-Planung",
    opsHandoff: "Übergabe Betrieb",
    quarterlyReport: "Quartalsbericht fällig",
    resetDay: "Reset-Tag",
    birthday: "Geburtstag von {name}",
  },
};

const fr: CalendarMessages = {
  meta: {
    title: "Planning de l’équipe",
    description:
      "Réunions, temps de concentration et événements sur la journée, à côté des affaires qui se concluent dans les 30 prochains jours.",
  },
  title: "Planning de l’équipe",
  kpis: {
    eventsInDays: { one: "Événements sur {count} jour", other: "Événements sur {count} jours" },
    booked: "Réservé en réunions",
    focus: "Temps de concentration protégé",
    hours: "{hours} h",
  },
  stepper: {
    label: "Changer de période",
    previous: "Période précédente",
    today: "Aujourd’hui",
    next: "Période suivante",
  },
  filter: {
    label: "Calendrier",
    all: "Tous les calendriers",
    work: "Travail",
    personal: "Personnel",
    team: "Équipe",
    focus: "Concentration",
  },
  views: { label: "Vue du calendrier", month: "Mois", week: "Semaine", day: "Jour" },
  addEvent: "Ajouter un événement",
  sidebar: {
    upNext: "À venir",
    nothingScheduled: "Rien d’autre de prévu ce mois-ci.",
    allDay: "Toute la journée",
    timeRange: "{start} – {end}",
    closingSoon: "À conclure prochainement",
    openPipeline: "Ouvrir le pipeline",
  },
  demoEvents: {
    monthlyPlanning: "Planification mensuelle",
    designReview: "Revue de design",
    clientCheckIn: "Point client",
    productWorkshop: "Atelier produit",
    standup: "Point quotidien de l’équipe",
    financeSync: "Point finance",
    focusBlock: "Bloc de concentration",
    sprintPlanning: "Planification du sprint",
    opsHandoff: "Passation des opérations",
    quarterlyReport: "Rapport trimestriel à rendre",
    resetDay: "Journée de pause",
    birthday: "Anniversaire de {name}",
  },
};

export const calendarMessages = defineMessages<CalendarMessages>({ en, es, de, fr });

export const calendarBundle: MessageBundle<CalendarMessages> = {
  key: calendarMessageKey,
  dictionary: calendarMessages,
};
