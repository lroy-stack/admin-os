import "server-only";

import { defineMessages, type PageMeta } from "@/core/i18n";

/** Text of /unauthorized. */
interface UnauthorizedMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly description: string;
  readonly home: string;
}

const en: UnauthorizedMessages = {
  meta: {
    title: "Unauthorized access",
    description: "You do not have permission to view the requested content.",
  },
  title: "Unauthorized access",
  description:
    "You do not have permission to view the requested content. Please contact the site administrator if you believe this is an error.",
  home: "Go to homepage",
};

const es: UnauthorizedMessages = {
  meta: {
    title: "Acceso no autorizado",
    description: "No tienes permiso para ver el contenido solicitado.",
  },
  title: "Acceso no autorizado",
  description:
    "No tienes permiso para ver el contenido solicitado. Si crees que se trata de un error, ponte en contacto con el administrador del sitio.",
  home: "Ir al inicio",
};

const de: UnauthorizedMessages = {
  meta: {
    title: "Kein Zugriff",
    description: "Du hast keine Berechtigung, die angeforderten Inhalte anzusehen.",
  },
  title: "Kein Zugriff",
  description:
    "Du hast keine Berechtigung, die angeforderten Inhalte anzusehen. Wende dich an den Administrator der Website, falls du einen Fehler vermutest.",
  home: "Zur Startseite",
};

const fr: UnauthorizedMessages = {
  meta: {
    title: "Accès non autorisé",
    description: "Vous n’avez pas l’autorisation de consulter le contenu demandé.",
  },
  title: "Accès non autorisé",
  description:
    "Vous n’avez pas l’autorisation de consulter le contenu demandé. Si vous pensez qu’il s’agit d’une erreur, contactez l’administrateur du site.",
  home: "Aller à l’accueil",
};

export const unauthorizedMessages = defineMessages<UnauthorizedMessages>({ en, es, de, fr });
