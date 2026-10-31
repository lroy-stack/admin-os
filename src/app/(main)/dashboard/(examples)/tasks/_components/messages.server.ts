import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type TasksMessages, tasksMessageKey } from "./messages";

const en: TasksMessages = {
  meta: {
    title: "Open Source Task Manager with shadcn/ui",
    description:
      "Explore an open source task manager for searching, filtering, organizing, and tracking work in one place.",
  },
  welcome: {
    title: "Welcome back",
    subtitle: "Here’s a list of your tasks for this month.",
  },
  statuses: {
    backlog: "Backlog",
    todo: "To do",
    "in progress": "In progress",
    done: "Done",
    canceled: "Canceled",
  },
  priorities: { low: "Low", medium: "Medium", high: "High" },
  labels: { bug: "Bug", feature: "Feature", documentation: "Documentation" },
  columns: { task: "Task", title: "Title", status: "Status", priority: "Priority" },
  sort: { ascending: "Ascending", descending: "Descending", reset: "Reset" },
  row: {
    selectAll: "Select all",
    selectRow: "Select row",
    openMenu: "Open menu",
    edit: "Edit",
    copy: "Make a copy",
    favorite: "Favorite",
    labels: "Labels",
    delete: "Delete",
    deleteShortcut: "⌘⌫",
  },
  toolbar: {
    filterPlaceholder: "Filter tasks…",
    status: "Status",
    priority: "Priority",
    clearFilters: "Clear filters",
    reset: "Reset",
    view: "View",
    toggleColumns: "Toggle columns",
  },
  table: {
    empty: "No results found.",
    selected: {
      one: "{count} of {total} row selected.",
      other: "{count} of {total} rows selected.",
    },
    rowsPerPage: "Rows per page",
    pageOf: "Page {page} of {pages}",
    pagination: "Pagination",
    firstPage: "Go to first page",
    previousPage: "Go to previous page",
    nextPage: "Go to next page",
    lastPage: "Go to last page",
    previous: "Previous",
    next: "Next",
  },
};

const es: TasksMessages = {
  meta: {
    title: "Gestor de tareas de código abierto con shadcn/ui",
    description:
      "Explora un gestor de tareas de código abierto para buscar, filtrar, organizar y seguir el trabajo en un solo lugar.",
  },
  welcome: {
    title: "Hola de nuevo",
    subtitle: "Aquí tienes la lista de tus tareas de este mes.",
  },
  statuses: {
    backlog: "Backlog",
    todo: "Por hacer",
    "in progress": "En curso",
    done: "Completada",
    canceled: "Cancelada",
  },
  priorities: { low: "Baja", medium: "Media", high: "Alta" },
  labels: { bug: "Error", feature: "Funcionalidad", documentation: "Documentación" },
  columns: { task: "Tarea", title: "Título", status: "Estado", priority: "Prioridad" },
  sort: { ascending: "Ascendente", descending: "Descendente", reset: "Restablecer" },
  row: {
    selectAll: "Seleccionar todo",
    selectRow: "Seleccionar fila",
    openMenu: "Abrir menú",
    edit: "Editar",
    copy: "Hacer una copia",
    favorite: "Marcar como favorita",
    labels: "Etiquetas",
    delete: "Eliminar",
    deleteShortcut: "⌘⌫",
  },
  toolbar: {
    filterPlaceholder: "Filtrar tareas…",
    status: "Estado",
    priority: "Prioridad",
    clearFilters: "Borrar filtros",
    reset: "Restablecer",
    view: "Ver",
    toggleColumns: "Mostrar columnas",
  },
  table: {
    empty: "No se encontraron resultados.",
    selected: {
      one: "{count} de {total} fila seleccionada.",
      other: "{count} de {total} filas seleccionadas.",
    },
    rowsPerPage: "Filas por página",
    pageOf: "Página {page} de {pages}",
    pagination: "Paginación",
    firstPage: "Ir a la primera página",
    previousPage: "Ir a la página anterior",
    nextPage: "Ir a la página siguiente",
    lastPage: "Ir a la última página",
    previous: "Anterior",
    next: "Siguiente",
  },
};

const de: TasksMessages = {
  meta: {
    title: "Open-Source-Aufgabenverwaltung mit shadcn/ui",
    description:
      "Entdecke eine Open-Source-Aufgabenverwaltung, mit der du Arbeit an einem Ort suchen, filtern, organisieren und verfolgen kannst.",
  },
  welcome: {
    title: "Willkommen zurück",
    subtitle: "Hier ist die Liste deiner Aufgaben für diesen Monat.",
  },
  statuses: {
    backlog: "Backlog",
    todo: "Zu erledigen",
    "in progress": "In Bearbeitung",
    done: "Erledigt",
    canceled: "Abgebrochen",
  },
  priorities: { low: "Niedrig", medium: "Mittel", high: "Hoch" },
  labels: { bug: "Fehler", feature: "Funktion", documentation: "Dokumentation" },
  columns: { task: "Aufgabe", title: "Titel", status: "Status", priority: "Priorität" },
  sort: { ascending: "Aufsteigend", descending: "Absteigend", reset: "Zurücksetzen" },
  row: {
    selectAll: "Alle auswählen",
    selectRow: "Zeile auswählen",
    openMenu: "Menü öffnen",
    edit: "Bearbeiten",
    copy: "Kopie erstellen",
    favorite: "Als Favorit markieren",
    labels: "Labels",
    delete: "Löschen",
    deleteShortcut: "⌘⌫",
  },
  toolbar: {
    filterPlaceholder: "Aufgaben filtern…",
    status: "Status",
    priority: "Priorität",
    clearFilters: "Filter entfernen",
    reset: "Zurücksetzen",
    view: "Ansicht",
    toggleColumns: "Spalten anzeigen",
  },
  table: {
    empty: "Keine Ergebnisse gefunden.",
    selected: {
      one: "{count} von {total} Zeile ausgewählt.",
      other: "{count} von {total} Zeilen ausgewählt.",
    },
    rowsPerPage: "Zeilen pro Seite",
    pageOf: "Seite {page} von {pages}",
    pagination: "Seitennavigation",
    firstPage: "Zur ersten Seite",
    previousPage: "Zur vorherigen Seite",
    nextPage: "Zur nächsten Seite",
    lastPage: "Zur letzten Seite",
    previous: "Zurück",
    next: "Weiter",
  },
};

const fr: TasksMessages = {
  meta: {
    title: "Gestionnaire de tâches open source avec shadcn/ui",
    description:
      "Découvrez un gestionnaire de tâches open source pour rechercher, filtrer, organiser et suivre le travail au même endroit.",
  },
  welcome: {
    title: "Bon retour",
    subtitle: "Voici la liste de vos tâches pour ce mois-ci.",
  },
  statuses: {
    backlog: "Backlog",
    todo: "À faire",
    "in progress": "En cours",
    done: "Terminée",
    canceled: "Annulée",
  },
  priorities: { low: "Basse", medium: "Moyenne", high: "Haute" },
  labels: { bug: "Anomalie", feature: "Fonctionnalité", documentation: "Documentation" },
  columns: { task: "Tâche", title: "Titre", status: "Statut", priority: "Priorité" },
  sort: { ascending: "Croissant", descending: "Décroissant", reset: "Réinitialiser" },
  row: {
    selectAll: "Tout sélectionner",
    selectRow: "Sélectionner la ligne",
    openMenu: "Ouvrir le menu",
    edit: "Modifier",
    copy: "Dupliquer",
    favorite: "Ajouter aux favoris",
    labels: "Étiquettes",
    delete: "Supprimer",
    deleteShortcut: "⌘⌫",
  },
  toolbar: {
    filterPlaceholder: "Filtrer les tâches…",
    status: "Statut",
    priority: "Priorité",
    clearFilters: "Effacer les filtres",
    reset: "Réinitialiser",
    view: "Affichage",
    toggleColumns: "Afficher les colonnes",
  },
  table: {
    empty: "Aucun résultat.",
    selected: {
      one: "{count} sur {total} ligne sélectionnée.",
      other: "{count} sur {total} lignes sélectionnées.",
    },
    rowsPerPage: "Lignes par page",
    pageOf: "Page {page} sur {pages}",
    pagination: "Pagination",
    firstPage: "Aller à la première page",
    previousPage: "Aller à la page précédente",
    nextPage: "Aller à la page suivante",
    lastPage: "Aller à la dernière page",
    previous: "Précédent",
    next: "Suivant",
  },
};

export const tasksMessages = defineMessages<TasksMessages>({ en, es, de, fr });

export const tasksBundle: MessageBundle<TasksMessages> = { key: tasksMessageKey, dictionary: tasksMessages };
