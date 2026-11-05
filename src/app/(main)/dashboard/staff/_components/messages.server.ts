import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type StaffDirectoryMessages, staffDirectoryMessageKey } from "./messages";

const en: StaffDirectoryMessages = {
  meta: { title: "Team", description: "The people who work here, with their roles and skills." },
  search: { label: "Search team members", placeholder: "Search name, role, skill…" },
  inactive: "Inactive",
  skills: "Skills",
  empty: {
    noMembersTitle: "No team members yet",
    noMembers: "The people you add to your team will appear here.",
    noMatchTitle: "No team members found",
    noMatch: "Nothing matches “{query}”.",
  },
  pager: { label: "Pages", next: "Next page", first: "First page" },
};

const es: StaffDirectoryMessages = {
  meta: { title: "Equipo", description: "Las personas que trabajan aquí, con sus roles y habilidades." },
  search: { label: "Buscar miembros del equipo", placeholder: "Buscar nombre, rol, habilidad…" },
  inactive: "Inactivo",
  skills: "Habilidades",
  empty: {
    noMembersTitle: "Todavía no hay miembros del equipo",
    noMembers: "Las personas que añadas a tu equipo aparecerán aquí.",
    noMatchTitle: "No se encontraron miembros del equipo",
    noMatch: "Nada coincide con «{query}».",
  },
  pager: { label: "Páginas", next: "Página siguiente", first: "Primera página" },
};

const de: StaffDirectoryMessages = {
  meta: { title: "Team", description: "Die Menschen, die hier arbeiten, mit ihren Rollen und Fähigkeiten." },
  search: { label: "Teammitglieder suchen", placeholder: "Name, Rolle, Fähigkeit suchen…" },
  inactive: "Inaktiv",
  skills: "Fähigkeiten",
  empty: {
    noMembersTitle: "Noch keine Teammitglieder",
    noMembers: "Die Personen, die du deinem Team hinzufügst, erscheinen hier.",
    noMatchTitle: "Keine Teammitglieder gefunden",
    noMatch: "Nichts passt zu „{query}“.",
  },
  pager: { label: "Seiten", next: "Nächste Seite", first: "Erste Seite" },
};

const fr: StaffDirectoryMessages = {
  meta: { title: "Équipe", description: "Les personnes qui travaillent ici, avec leurs rôles et leurs compétences." },
  search: { label: "Rechercher des membres de l’équipe", placeholder: "Rechercher nom, rôle, compétence…" },
  inactive: "Inactif",
  skills: "Compétences",
  empty: {
    noMembersTitle: "Pas encore de membres de l’équipe",
    noMembers: "Les personnes que vous ajoutez à votre équipe apparaîtront ici.",
    noMatchTitle: "Aucun membre de l’équipe trouvé",
    noMatch: "Rien ne correspond à « {query} ».",
  },
  pager: { label: "Pages", next: "Page suivante", first: "Première page" },
};

export const staffDirectoryMessages = defineMessages<StaffDirectoryMessages>({ en, es, de, fr });

export const staffDirectoryBundle: MessageBundle<StaffDirectoryMessages> = {
  key: staffDirectoryMessageKey,
  dictionary: staffDirectoryMessages,
};
