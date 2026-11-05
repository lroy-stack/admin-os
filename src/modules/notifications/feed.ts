import { format, type Locale } from "@/core/i18n";
import type { FeedServer } from "@/core/module";
import { pageOutput } from "@/core/pagination";

import type { NotificationsMessages } from "./messages";
import { notificationsMessages } from "./messages";
import { type Notification, notificationSchema } from "./schema";

const NAMESPACE = "notifications.";

/** The template a notification's key points at in the `notifications` dictionary (`notifications.kinds.…`). */
export function textAt(messages: NotificationsMessages, key: string): string {
  if (!key.startsWith(NAMESPACE)) throw new Error(`Notification key ${key} is outside the notifications dictionary`);
  const found = key
    .slice(NAMESPACE.length)
    .split(".")
    .reduce<unknown>(
      (node, part) => (typeof node === "object" && node !== null ? Reflect.get(node, part) : undefined),
      messages,
    );
  if (typeof found !== "string") throw new Error(`Notification key ${key} names no message`);
  return found;
}

/** One notification as a row of the bell's panel, worded for the locale. */
export function notificationRow(notification: Notification, messages: NotificationsMessages, locale: Locale) {
  const params = Object.fromEntries(Object.entries(notification.params).map(([name, value]) => [name, String(value)]));
  return {
    id: notification.id,
    kind: notification.kind,
    title: format(textAt(messages, notification.titleKey), locale, params),
    body: format(textAt(messages, notification.bodyKey), locale, params),
    unread: notification.readAt === undefined,
  };
}

/** The server half of the notifications feed: the rows of `notifications.list`'s page. */
export const notificationsFeed = {
  rows: (page, locale) => {
    const parsed = pageOutput(notificationSchema).safeParse(page);
    return parsed.success
      ? parsed.data.items.map((item) => notificationRow(item, notificationsMessages[locale], locale))
      : undefined;
  },
} satisfies FeedServer;
