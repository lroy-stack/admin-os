import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type ProductivityMessages, productivityMessageKey } from "./messages";

const en: ProductivityMessages = {
  meta: {
    title: "Open Source Productivity Dashboard with shadcn/ui",
    description:
      "Explore an open source productivity dashboard with tasks, projects, focus time, notes, schedules, and weekly progress.",
  },
  greeting: {
    title: "Good morning, {name}.",
    subtitle: "Let’s make today productive and meaningful.",
  },
  summary: {
    today: "Today",
    tasksScheduled: { one: "task scheduled", other: "tasks scheduled" },
    thisWeek: "This week",
    progress: "progress",
    focus: "Focus",
    deepWork: "Deep work",
    hoursRemaining: { one: "{count} hour remaining", other: "{count} hours remaining" },
  },
  tasks: {
    title: "Tasks",
    empty: "No tasks in this range.",
    rangeLabel: "Task range",
    ranges: { today: "Today", tomorrow: "Tomorrow", thisWeek: "This week" },
    newTask: "New task",
    tags: { work: "Work", design: "Design", admin: "Admin", content: "Content", planning: "Planning" },
    items: {
      finalizeRoadmap: "Finalize Q2 roadmap",
      reviewDesignSystem: "Review design system updates",
      replyToEmails: "Reply to important emails",
      planContent: "Plan creator content for this week",
      prepareSyncNotes: "Prepare weekly team sync notes",
    },
  },
  projects: {
    title: "Projects",
    empty: "No projects with this status.",
    progress: "Progress",
    filterLabel: "Project filter",
    filters: { active: "Active", planning: "Planning", completed: "Completed" },
    new: "New",
    due: "Due {date}",
    statuses: { inProgress: "In progress", planning: "Planning", completed: "Completed" },
    items: {
      roadmap: { title: "Q2 roadmap", description: "Ship better, ship smarter." },
      website: { title: "Website redesign", description: "Clean, modern, and fast." },
      onboarding: { title: "Onboarding", description: "Trim first-run steps." },
    },
  },
  quickActions: {
    title: "Quick actions",
    newNote: "New note",
    newTask: "New task",
    newProject: "New project",
    newGoal: "New goal",
  },
  quote: {
    title: "Small, consistent actions lead to big results.",
    subtitle: "Keep showing up. You’ve got this.",
  },
  focus: {
    title: "Focus",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    noNotifications: "No notifications · Full focus",
  },
  notes: {
    title: "Recent notes",
    today: "Today",
    yesterday: "Yesterday",
    items: {
      designPrinciples: "Design principles that scale",
      contentIdeas: "Content ideas – {month}",
      weeklyLessons: "Lessons from the week",
      books: "Books I’m reading",
    },
  },
  week: {
    title: "This week",
    encouragement: "You’re doing great. Keep the momentum going.",
    goals: { one: "{done} of {count} goal completed", other: "{done} of {count} goals completed" },
  },
  done: "Done",
  forms: {
    required: "This field is required.",
    title: "Title",
    description: "Description",
    tag: "Tag",
    when: "When",
    time: "Time",
    status: "Status",
    due: "Due date",
    goal: "Goal",
  },
  toasts: { task: "Task added", project: "Project added", note: "Note added", goal: "Goal added" },
};

const es: ProductivityMessages = {
  meta: {
    title: "Panel de productividad de código abierto con shadcn/ui",
    description:
      "Explora un panel de productividad de código abierto con tareas, proyectos, tiempo de concentración, notas, agenda y progreso semanal.",
  },
  greeting: {
    title: "Buenos días, {name}.",
    subtitle: "Hagamos que hoy sea un día productivo y con sentido.",
  },
  summary: {
    today: "Hoy",
    tasksScheduled: { one: "tarea programada", other: "tareas programadas" },
    thisWeek: "Esta semana",
    progress: "progreso",
    focus: "Concentración",
    deepWork: "Trabajo profundo",
    hoursRemaining: { one: "queda {count} hora", other: "quedan {count} horas" },
  },
  tasks: {
    title: "Tareas",
    empty: "No hay tareas en este periodo.",
    rangeLabel: "Periodo de las tareas",
    ranges: { today: "Hoy", tomorrow: "Mañana", thisWeek: "Esta semana" },
    newTask: "Nueva tarea",
    tags: { work: "Trabajo", design: "Diseño", admin: "Gestión", content: "Contenido", planning: "Planificación" },
    items: {
      finalizeRoadmap: "Cerrar la hoja de ruta del T2",
      reviewDesignSystem: "Revisar las actualizaciones del sistema de diseño",
      replyToEmails: "Responder a los correos importantes",
      planContent: "Planificar el contenido de la semana",
      prepareSyncNotes: "Preparar las notas de la reunión semanal del equipo",
    },
  },
  projects: {
    title: "Proyectos",
    empty: "No hay proyectos con este estado.",
    progress: "Progreso",
    filterLabel: "Filtro de proyectos",
    filters: { active: "Activos", planning: "En planificación", completed: "Completados" },
    new: "Nuevo",
    due: "Vence el {date}",
    statuses: { inProgress: "En curso", planning: "En planificación", completed: "Completado" },
    items: {
      roadmap: { title: "Hoja de ruta del T2", description: "Entregar mejor, con más criterio." },
      website: { title: "Rediseño del sitio web", description: "Limpio, moderno y rápido." },
      onboarding: { title: "Incorporación", description: "Reducir los pasos iniciales." },
    },
  },
  quickActions: {
    title: "Acciones rápidas",
    newNote: "Nueva nota",
    newTask: "Nueva tarea",
    newProject: "Nuevo proyecto",
    newGoal: "Nuevo objetivo",
  },
  quote: {
    title: "Las acciones pequeñas y constantes llevan a grandes resultados.",
    subtitle: "Sigue adelante. Tú puedes.",
  },
  focus: {
    title: "Concentración",
    start: "Iniciar",
    pause: "Pausar",
    resume: "Reanudar",
    noNotifications: "Sin notificaciones · Concentración total",
  },
  notes: {
    title: "Notas recientes",
    today: "Hoy",
    yesterday: "Ayer",
    items: {
      designPrinciples: "Principios de diseño que escalan",
      contentIdeas: "Ideas de contenido – {month}",
      weeklyLessons: "Lecciones de la semana",
      books: "Libros que estoy leyendo",
    },
  },
  week: {
    title: "Esta semana",
    encouragement: "Lo estás haciendo genial. Mantén el ritmo.",
    goals: { one: "{done} de {count} objetivo completado", other: "{done} de {count} objetivos completados" },
  },
  done: "Hecho",
  forms: {
    required: "Este campo es obligatorio.",
    title: "Título",
    description: "Descripción",
    tag: "Etiqueta",
    when: "Cuándo",
    time: "Hora",
    status: "Estado",
    due: "Fecha de vencimiento",
    goal: "Objetivo",
  },
  toasts: { task: "Tarea añadida", project: "Proyecto añadido", note: "Nota añadida", goal: "Objetivo añadido" },
};

const de: ProductivityMessages = {
  meta: {
    title: "Open-Source-Produktivitäts-Dashboard mit shadcn/ui",
    description:
      "Entdecke ein Open-Source-Produktivitäts-Dashboard mit Aufgaben, Projekten, Fokuszeit, Notizen, Terminen und Wochenfortschritt.",
  },
  greeting: {
    title: "Guten Morgen, {name}.",
    subtitle: "Machen wir den Tag produktiv und sinnvoll.",
  },
  summary: {
    today: "Heute",
    tasksScheduled: { one: "Aufgabe geplant", other: "Aufgaben geplant" },
    thisWeek: "Diese Woche",
    progress: "Fortschritt",
    focus: "Fokus",
    deepWork: "Konzentriertes Arbeiten",
    hoursRemaining: { one: "noch {count} Stunde", other: "noch {count} Stunden" },
  },
  tasks: {
    title: "Aufgaben",
    empty: "Keine Aufgaben in diesem Zeitraum.",
    rangeLabel: "Zeitraum der Aufgaben",
    ranges: { today: "Heute", tomorrow: "Morgen", thisWeek: "Diese Woche" },
    newTask: "Neue Aufgabe",
    tags: { work: "Arbeit", design: "Design", admin: "Verwaltung", content: "Inhalte", planning: "Planung" },
    items: {
      finalizeRoadmap: "Q2-Roadmap finalisieren",
      reviewDesignSystem: "Updates am Designsystem prüfen",
      replyToEmails: "Wichtige E-Mails beantworten",
      planContent: "Inhalte für diese Woche planen",
      prepareSyncNotes: "Notizen für das wöchentliche Team-Sync vorbereiten",
    },
  },
  projects: {
    title: "Projekte",
    empty: "Keine Projekte mit diesem Status.",
    progress: "Fortschritt",
    filterLabel: "Projektfilter",
    filters: { active: "Aktiv", planning: "In Planung", completed: "Abgeschlossen" },
    new: "Neu",
    due: "Frist: {date}",
    statuses: { inProgress: "In Bearbeitung", planning: "In Planung", completed: "Abgeschlossen" },
    items: {
      roadmap: { title: "Q2-Roadmap", description: "Besser liefern, schlauer arbeiten." },
      website: { title: "Website-Relaunch", description: "Klar, modern und schnell." },
      onboarding: { title: "Onboarding", description: "Erste Schritte verschlanken." },
    },
  },
  quickActions: {
    title: "Schnellaktionen",
    newNote: "Neue Notiz",
    newTask: "Neue Aufgabe",
    newProject: "Neues Projekt",
    newGoal: "Neues Ziel",
  },
  quote: {
    title: "Kleine, stetige Schritte führen zu großen Ergebnissen.",
    subtitle: "Bleib dran. Du schaffst das.",
  },
  focus: {
    title: "Fokus",
    start: "Starten",
    pause: "Pausieren",
    resume: "Fortsetzen",
    noNotifications: "Keine Benachrichtigungen · Volle Konzentration",
  },
  notes: {
    title: "Letzte Notizen",
    today: "Heute",
    yesterday: "Gestern",
    items: {
      designPrinciples: "Designprinzipien, die skalieren",
      contentIdeas: "Content-Ideen – {month}",
      weeklyLessons: "Erkenntnisse der Woche",
      books: "Bücher, die ich lese",
    },
  },
  week: {
    title: "Diese Woche",
    encouragement: "Das läuft richtig gut. Bleib im Schwung.",
    goals: { one: "{done} von {count} Ziel erreicht", other: "{done} von {count} Zielen erreicht" },
  },
  done: "Fertig",
  forms: {
    required: "Dieses Feld ist erforderlich.",
    title: "Titel",
    description: "Beschreibung",
    tag: "Kategorie",
    when: "Wann",
    time: "Uhrzeit",
    status: "Status",
    due: "Fälligkeitsdatum",
    goal: "Ziel",
  },
  toasts: {
    task: "Aufgabe hinzugefügt",
    project: "Projekt hinzugefügt",
    note: "Notiz hinzugefügt",
    goal: "Ziel hinzugefügt",
  },
};

const fr: ProductivityMessages = {
  meta: {
    title: "Tableau de bord de productivité open source avec shadcn/ui",
    description:
      "Découvrez un tableau de bord de productivité open source avec tâches, projets, temps de concentration, notes, planning et progression hebdomadaire.",
  },
  greeting: {
    title: "Bonjour {name}.",
    subtitle: "Faisons de cette journée un moment productif et utile.",
  },
  summary: {
    today: "Aujourd’hui",
    tasksScheduled: { one: "tâche planifiée", other: "tâches planifiées" },
    thisWeek: "Cette semaine",
    progress: "avancement",
    focus: "Concentration",
    deepWork: "Travail en profondeur",
    hoursRemaining: { one: "{count} heure restante", other: "{count} heures restantes" },
  },
  tasks: {
    title: "Tâches",
    empty: "Aucune tâche sur cette période.",
    rangeLabel: "Période des tâches",
    ranges: { today: "Aujourd’hui", tomorrow: "Demain", thisWeek: "Cette semaine" },
    newTask: "Nouvelle tâche",
    tags: { work: "Travail", design: "Design", admin: "Administratif", content: "Contenu", planning: "Planification" },
    items: {
      finalizeRoadmap: "Finaliser la feuille de route du T2",
      reviewDesignSystem: "Examiner les mises à jour du design system",
      replyToEmails: "Répondre aux e-mails importants",
      planContent: "Planifier le contenu de la semaine",
      prepareSyncNotes: "Préparer les notes de la réunion d’équipe hebdomadaire",
    },
  },
  projects: {
    title: "Projets",
    empty: "Aucun projet avec ce statut.",
    progress: "Progression",
    filterLabel: "Filtre des projets",
    filters: { active: "Actifs", planning: "En préparation", completed: "Terminés" },
    new: "Nouveau",
    due: "Échéance : {date}",
    statuses: { inProgress: "En cours", planning: "En préparation", completed: "Terminé" },
    items: {
      roadmap: { title: "Feuille de route du T2", description: "Livrer mieux, livrer plus malin." },
      website: { title: "Refonte du site web", description: "Épuré, moderne et rapide." },
      onboarding: { title: "Prise en main", description: "Alléger les premières étapes." },
    },
  },
  quickActions: {
    title: "Actions rapides",
    newNote: "Nouvelle note",
    newTask: "Nouvelle tâche",
    newProject: "Nouveau projet",
    newGoal: "Nouvel objectif",
  },
  quote: {
    title: "De petites actions régulières mènent à de grands résultats.",
    subtitle: "Continuez. Vous en êtes capable.",
  },
  focus: {
    title: "Concentration",
    start: "Démarrer",
    pause: "Mettre en pause",
    resume: "Reprendre",
    noNotifications: "Aucune notification · Concentration totale",
  },
  notes: {
    title: "Notes récentes",
    today: "Aujourd’hui",
    yesterday: "Hier",
    items: {
      designPrinciples: "Des principes de design qui passent à l’échelle",
      contentIdeas: "Idées de contenu – {month}",
      weeklyLessons: "Enseignements de la semaine",
      books: "Livres que je lis",
    },
  },
  week: {
    title: "Cette semaine",
    encouragement: "Vous faites du bon travail. Gardez l’élan.",
    goals: { one: "{done} sur {count} objectif atteint", other: "{done} sur {count} objectifs atteints" },
  },
  done: "Terminé",
  forms: {
    required: "Ce champ est obligatoire.",
    title: "Titre",
    description: "Description",
    tag: "Étiquette",
    when: "Quand",
    time: "Heure",
    status: "Statut",
    due: "Date d’échéance",
    goal: "Objectif",
  },
  toasts: { task: "Tâche ajoutée", project: "Projet ajouté", note: "Note ajoutée", goal: "Objectif ajouté" },
};

export const productivityMessages = defineMessages<ProductivityMessages>({ en, es, de, fr });

export const productivityBundle: MessageBundle<ProductivityMessages> = {
  key: productivityMessageKey,
  dictionary: productivityMessages,
};
