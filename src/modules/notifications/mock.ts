import { type MockContext, mockHandler } from "@/core/mock";
import { paginate } from "@/core/pagination";
import { ok, type Result } from "@/core/result";
import { lateAfterMinutes } from "@/modules/bookings";

import { notificationsList, notificationsRead, notificationsReadAll, notificationsUnreadCount } from "./capabilities";
import { deriveNotifications, type FeedSource } from "./derive";
import type { Notification, NotificationMoment } from "./schema";
import { bookingSoonMinutes } from "./settings";

type Context = MockContext<FeedSource>;

/**
 * Which notifications each session has read, and when. It is keyed by the session's data object, so it lives and
 * dies with the session copy (ADR 0005) and needs no collection in the seed. A read of the shared seed (no session)
 * finds nothing here, so every notification is unread there.
 */
const readMarks = new WeakMap<object, Map<string, NotificationMoment>>();

const marksOf = (data: FeedSource): ReadonlyMap<string, NotificationMoment> => readMarks.get(data) ?? new Map();

/** The feed with its read marks applied, newest first. */
const feedOf = ({ data, clock, settings }: Context): Notification[] => {
  const marks = marksOf(data);
  return deriveNotifications(data, clock, {
    soonMinutes: settings.get(bookingSoonMinutes),
    lateAfterMinutes: settings.get(lateAfterMinutes),
  }).map((item) => {
    const readAt = marks.get(item.id);
    return readAt === undefined ? item : { ...item, readAt };
  });
};

const unreadOf = (feed: readonly Notification[]): number => feed.filter((item) => item.readAt === undefined).length;

/** Marks the unread ones among `ids`, and answers how many it marked and how many are still unread. */
const markRead = (context: Context, ids: ReadonlySet<string>): Result<{ marked: number; unreadCount: number }> => {
  const feed = feedOf(context);
  const targets = feed.filter((item) => item.readAt === undefined && ids.has(item.id));
  const marks = readMarks.get(context.data) ?? new Map<string, NotificationMoment>();
  const at = { day: context.clock.businessDay, minute: context.clock.nowMin };
  for (const item of targets) marks.set(item.id, at);
  readMarks.set(context.data, marks);
  return ok({ marked: targets.length, unreadCount: unreadOf(feed) - targets.length });
};

const unreadFeed = (context: Context) => unreadOf(feedOf(context));

/** Mock answers for the notifications module (ADR 0005): the feed is derived from the session's bookings. */
export const notificationsMockHandlers = {
  ...mockHandler(notificationsList, (input, context: Context) => {
    const feed = feedOf(context);
    const page = paginate(feed, input);
    return page.ok ? ok({ ...page.value, unreadCount: unreadOf(feed) }) : page;
  }),

  ...mockHandler(notificationsUnreadCount, (_input, context: Context) => ok({ unreadCount: unreadFeed(context) })),

  ...mockHandler(notificationsRead, ({ ids }, context: Context) => markRead(context, new Set(ids))),

  ...mockHandler(notificationsReadAll, (_input, context: Context) =>
    markRead(context, new Set(feedOf(context).map((item) => item.id))),
  ),
};
