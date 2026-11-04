import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { err, ok, type Result } from "@/core/result";
import { lateAfterMinutes } from "@/modules/bookings";

import { notificationsList, notificationsRead, notificationsReadAll, notificationsUnreadCount } from "./capabilities";
import { deriveApprovalNotifications, deriveNotifications, type FeedSource } from "./derive";
import type { Notification, NotificationMoment } from "./schema";
import { bookingSoonMinutes } from "./settings";

type Context = MockContext<FeedSource>;

/**
 * The read marks live in the session's own data, under `notificationReads` (notification id -> when it was read), so
 * they are part of whatever persists the session copy (ADR 0005) and need no collection in the seed. A read of the
 * shared seed (no session) finds none, so every notification is unread there.
 */
type MarkedData = FeedSource & { notificationReads?: Record<string, NotificationMoment> };

const marksOf = (data: FeedSource): Readonly<Record<string, NotificationMoment>> =>
  (data as MarkedData).notificationReads ?? {};

/** The feed with its read marks applied, newest first. */
const feedOf = ({ data, clock, settings, actor, approvals, nowMs }: Context): Notification[] => {
  const marks = marksOf(data);
  const bookingItems = deriveNotifications(data, clock, {
    soonMinutes: settings.get(bookingSoonMinutes),
    lateAfterMinutes: settings.get(lateAfterMinutes),
  });
  // Only the people who can decide hear that a write waits.
  const approvalItems = actor.permissions.includes("decide:approvals")
    ? deriveApprovalNotifications(approvals, clock, nowMs)
    : [];
  return [...approvalItems, ...bookingItems].map((item) => {
    const readAt = marks[item.id];
    return readAt === undefined ? item : { ...item, readAt };
  });
};

const unreadOf = (feed: readonly Notification[]): number => feed.filter((item) => item.readAt === undefined).length;

/** Marks the unread ones among `ids`, and answers how many it marked and how many are still unread. */
const markRead = (context: Context, ids: ReadonlySet<string>): Result<{ marked: number; unreadCount: number }> => {
  const feed = feedOf(context);
  // A waiting approval stays unread until a person decides it: an agent must not be able to silence it.
  const targets = feed.filter(
    (item) => item.readAt === undefined && item.kind !== "approval.requested" && ids.has(item.id),
  );
  const data = context.data as MarkedData;
  data.notificationReads ??= {};
  const at = { day: context.clock.businessDay, minute: context.clock.nowMin };
  for (const item of targets) data.notificationReads[item.id] = at;
  return ok({ marked: targets.length, unreadCount: unreadOf(feed) - targets.length });
};

const unreadFeed = (context: Context) => unreadOf(feedOf(context));

/** Whether `a` comes after `b` on the business clock; business days are ISO dates, so they compare as strings. */
const isAfter = (a: NotificationMoment, b: NotificationMoment): boolean =>
  a.day > b.day || (a.day === b.day && a.minute > b.minute);

/** Mock answers for the notifications module (ADR 0005): the feed is derived from the session's bookings. */
export const notificationsMockHandlers = {
  ...mockHandler(notificationsList, (input, context: Context) => {
    const feed = feedOf(context);
    const page = paginate(feed, input);
    return page.ok ? ok({ ...page.value, unreadCount: unreadOf(feed) }) : page;
  }),

  ...mockHandler(notificationsUnreadCount, (_input, context: Context) => ok({ unreadCount: unreadFeed(context) })),

  ...mockHandler(notificationsRead, ({ ids }, context: Context) => markRead(context, new Set(ids))),

  ...mockHandler(notificationsReadAll, ({ upTo }, context: Context) => {
    const feed = feedOf(context);
    if (upTo === undefined) return markRead(context, new Set(feed.map((item) => item.id)));
    const bound = feed.find((item) => item.id === upTo);
    if (bound === undefined) {
      return err("notifications.not_found", `No notification with id ${upTo}`, { ids: [upTo] });
    }
    const seen = feed.filter((item) => !isAfter(item.createdAt, bound.createdAt));
    return markRead(context, new Set(seen.map((item) => item.id)));
  }),
};
