import { defineMessages, type Plural } from "@/core/i18n";

export interface ResourcesMessages {
  readonly title: string;
  readonly count: Plural;
  /** Singular name of one resource, shown next to its label. */
  readonly kind: string;
}

export const resourcesMessages = defineMessages<ResourcesMessages>({
  en: { title: "Resources", count: { one: "{count} resource", other: "{count} resources" }, kind: "Resource" },
  es: { title: "Recursos", count: { one: "{count} recurso", other: "{count} recursos" }, kind: "Recurso" },
  de: { title: "Ressourcen", count: { one: "{count} Ressource", other: "{count} Ressourcen" }, kind: "Ressource" },
  fr: { title: "Ressources", count: { one: "{count} ressource", other: "{count} ressources" }, kind: "Ressource" },
});
