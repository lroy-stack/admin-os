import { format, type Locale } from "@/core/i18n";
import type { Notification, NotificationKind } from "@/modules/notifications";
import type { NotificationsMessages } from "@/modules/notifications/server";

/** One row of the bell's panel, already worded for the locale, so the module's dictionary stays on the server. */
export interface NotificationView {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly unread: boolean;
  /** Present on a write an assistant is waiting on: the panel offers approve and reject for it. */
  readonly approvalId?: string;
}

/** What the panel shows: the rows, or the worded reason they could not be read (a failure is never an empty list). */
export type NotificationsAnswer =
  | { readonly status: "ok"; readonly items: readonly NotificationView[] }
  | { readonly status: "error"; readonly text: string };

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

export function notificationView(
  notification: Notification,
  messages: NotificationsMessages,
  locale: Locale,
): NotificationView {
  const params = Object.fromEntries(Object.entries(notification.params).map(([name, value]) => [name, String(value)]));
  const approvalId = notification.link?.entity === "approval" ? notification.link.id : undefined;
  return {
    id: notification.id,
    kind: notification.kind,
    title: format(textAt(messages, notification.titleKey), locale, params),
    body: format(textAt(messages, notification.bodyKey), locale, params),
    unread: notification.readAt === undefined,
    ...(approvalId === undefined ? {} : { approvalId }),
  };
}
