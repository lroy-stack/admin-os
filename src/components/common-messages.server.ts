import "server-only";

import { defineMessages, type MessageBundle } from "@/core/i18n";

import { type CommonMessages, commonMessageKey } from "./common-messages";

const en: CommonMessages = { dateRange: { select: "Select date" } };
const es: CommonMessages = { dateRange: { select: "Seleccionar fecha" } };
const de: CommonMessages = { dateRange: { select: "Datum auswählen" } };
const fr: CommonMessages = { dateRange: { select: "Sélectionner une date" } };

export const commonMessages = defineMessages<CommonMessages>({ en, es, de, fr });

/** Pass to the layout that mounts shared components from `src/components`. */
export const commonBundle: MessageBundle<CommonMessages> = { key: commonMessageKey, dictionary: commonMessages };
