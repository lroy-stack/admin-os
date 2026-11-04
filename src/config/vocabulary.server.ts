import "server-only";

import { accessMessages } from "@/core/access/server";
import { approvalsMessages } from "@/core/approvals/server";
import { flattenMessages, type Locale, type Message, type Vocabulary } from "@/core/i18n";
import { navigationMessages } from "@/core/nav/server";
import { bookingsMessages } from "@/modules/bookings/server";
import { catalogMessages } from "@/modules/catalog/server";
import { customersMessages } from "@/modules/customers/server";
import { notificationsMessages } from "@/modules/notifications/server";
import { resourcesMessages } from "@/modules/resources/server";
import { staffMessages } from "@/modules/staff/server";
import { hospitalityVocabulary } from "@/verticals/hospitality/server";
import { salonVocabulary } from "@/verticals/salon/server";
import { workshopVocabulary } from "@/verticals/workshop/server";

import type { VerticalId } from "./vertical";

/** The default messages of each module and of the kernel (`access`, `nav`), keyed by the first segment of a message key. */
export const MODULE_MESSAGES: Readonly<Record<string, Readonly<Record<Locale, unknown>>>> = {
  access: accessMessages,
  approvals: approvalsMessages,
  nav: navigationMessages,
  bookings: bookingsMessages,
  catalog: catalogMessages,
  customers: customersMessages,
  notifications: notificationsMessages,
  resources: resourcesMessages,
  staff: staffMessages,
};

const VOCABULARIES = {
  hospitality: hospitalityVocabulary,
  salon: salonVocabulary,
  workshop: workshopVocabulary,
} as const satisfies Record<VerticalId, Vocabulary>;

const flattened = new Map<string, ReadonlyMap<string, Message>>();

function defaultMessage(locale: Locale, key: string): Message | undefined {
  const moduleId = key.split(".")[0] ?? "";
  const cacheKey = `${locale}:${moduleId}`;
  let messages = flattened.get(cacheKey);
  if (!messages) {
    const dictionary = MODULE_MESSAGES[moduleId]?.[locale];
    messages = dictionary === undefined ? new Map() : flattenMessages(dictionary);
    flattened.set(cacheKey, messages);
  }
  return messages.get(key.slice(moduleId.length + 1));
}

/**
 * A text message (a label) of the preset in one locale: its vocabulary override first, then the module default
 * (ADR 0004). Throws for a key that is missing or is a plural, so a bad `labelKey` fails loudly in development.
 */
export function textFor(vertical: VerticalId, locale: Locale, key: string): string {
  const vocabulary: Vocabulary = VOCABULARIES[vertical];
  const message = vocabulary[key]?.[locale] ?? defaultMessage(locale, key);
  if (typeof message !== "string") {
    throw new Error(`Message "${key}" must be a text message in "${locale}" for the "${vertical}" preset.`);
  }
  return message;
}
