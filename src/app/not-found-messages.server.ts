import "server-only";

import { defineMessages, type PageMeta } from "@/core/i18n";

/** Text of the 404 page (`not-found.tsx`). */
interface NotFoundMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly description: string;
  readonly home: string;
}

const en: NotFoundMessages = {
  meta: { title: "Page not found", description: "The page you are looking for could not be found." },
  title: "Page not found",
  description: "The page you are looking for could not be found.",
  home: "Go back home",
};

const es: NotFoundMessages = {
  meta: { title: "Página no encontrada", description: "No se ha encontrado la página que buscas." },
  title: "Página no encontrada",
  description: "No se ha encontrado la página que buscas.",
  home: "Volver al inicio",
};

const de: NotFoundMessages = {
  meta: { title: "Seite nicht gefunden", description: "Die gesuchte Seite wurde nicht gefunden." },
  title: "Seite nicht gefunden",
  description: "Die gesuchte Seite wurde nicht gefunden.",
  home: "Zurück zur Startseite",
};

const fr: NotFoundMessages = {
  meta: { title: "Page introuvable", description: "La page que vous recherchez est introuvable." },
  title: "Page introuvable",
  description: "La page que vous recherchez est introuvable.",
  home: "Retour à l’accueil",
};

export const notFoundMessages = defineMessages<NotFoundMessages>({ en, es, de, fr });
