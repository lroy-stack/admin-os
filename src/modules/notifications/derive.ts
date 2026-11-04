import type { BusinessClock } from "@/core/clock";
import type { ApprovalRecord } from "@/core/mock";
import type { BookingInput } from "@/modules/bookings";

import type { Notification, NotificationMoment } from "./schema";

const DAY_MINUTES = 1440;

/** The slice of the session data the feed reads. Notifications never write to another module. */
export interface FeedSource {
  readonly bookings: readonly BookingInput[];
  readonly customers: readonly { readonly id: string; readonly name: string }[];
}

export interface FeedRules {
  /** Minutes before the start from which a booking that has not arrived is announced. */
  readonly soonMinutes: number;
  /** Minutes after the start from which a booking that has not arrived counts as late. */
  readonly lateAfterMinutes: number;
}

/** `HH:mm` of a minute counted from midnight; past-midnight service minutes wrap onto the clock face. */
export const timeLabel = (minute: number): string => {
  const wrapped = minute % DAY_MINUTES;
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

/** Newest first; equal moments fall back to the id so the order never depends on insertion. */
const newestFirst = (a: Notification, b: Notification): number =>
  b.createdAt.day.localeCompare(a.createdAt.day) || b.createdAt.minute - a.createdAt.minute || a.id.localeCompare(b.id);

const NOT_ARRIVED = new Set<string>(["pending", "confirmed"]);
const AWAITING_GUEST = new Set<string>(["pending", "awaiting_payment"]);

/**
 * The notifications the business day's bookings give rise to, newest first (deterministic: it reads the business
 * clock, never real time):
 * - `booking.soon`: a booking that has not arrived and starts within `soonMinutes`;
 * - `booking.late`: a booking that has not arrived `lateAfterMinutes` after its start;
 * - `booking.new`: a booking created during the session (except a walk-in, which staff just seated) or an online
 *   booking still waiting on staff or on its deposit.
 * Ids are stable (`<kind>:<bookingId>`), so a read mark survives between calls.
 */
export function deriveNotifications(source: FeedSource, clock: BusinessClock, rules: FeedRules): Notification[] {
  const now = clock.nowMin < clock.cutoffMin ? clock.nowMin + DAY_MINUTES : clock.nowMin;
  const nameOf = (booking: BookingInput): string =>
    booking.contactName ?? source.customers.find((customer) => customer.id === booking.customerId)?.name ?? booking.id;

  const make = (
    kind: Notification["kind"],
    booking: BookingInput,
    createdAt: NotificationMoment,
    extra: Notification["params"] = {},
  ): Notification => ({
    id: `${kind}:${booking.id}`,
    kind,
    titleKey: `notifications.kinds.${kindKey(kind)}.title`,
    bodyKey: `notifications.kinds.${kindKey(kind)}.body`,
    params: { name: nameOf(booking), time: timeLabel(booking.startMin), partySize: booking.partySize ?? 1, ...extra },
    createdAt,
    link: { entity: "booking", id: booking.id },
  });

  const today = source.bookings.filter((booking) => booking.businessDay === clock.businessDay);
  const moment = (minute: number): NotificationMoment => ({ day: clock.businessDay, minute });

  return today
    .flatMap((booking) => {
      const waiting = NOT_ARRIVED.has(booking.status);
      const untilStart = booking.startMin - now;
      const items: Notification[] = [];
      if (waiting && untilStart > 0 && untilStart <= rules.soonMinutes) {
        items.push(
          make("booking.soon", booking, moment(booking.startMin - rules.soonMinutes), { minutes: untilStart }),
        );
      }
      if (waiting && -untilStart >= rules.lateAfterMinutes) {
        items.push(
          make("booking.late", booking, moment(booking.startMin + rules.lateAfterMinutes), { minutes: -untilStart }),
        );
      }
      const madeInSession = booking.createdAt !== undefined && booking.origin !== "walk_in";
      const onlineAndOpen = booking.origin === "online" && AWAITING_GUEST.has(booking.status);
      if (madeInSession || onlineAndOpen) {
        items.push(make("booking.new", booking, booking.createdAt ?? moment(Math.min(now, booking.startMin))));
      }
      return items;
    })
    .sort(newestFirst);
}

/**
 * One notification per write an assistant asked for that still waits for a person (ADR 0016, D7). It lasts as long as
 * the request is pending: deciding or expiring it removes it from the feed. `target` is the record the input names,
 * when it names one, so the text can say "cancel R-1043".
 */
export function deriveApprovalNotifications(
  approvals: readonly ApprovalRecord[],
  clock: BusinessClock,
  nowMs: number,
): Notification[] {
  const createdAt: NotificationMoment = { day: clock.businessDay, minute: clock.nowMin };
  return approvals
    .filter((record) => record.status === "pending" && Date.parse(record.expiresAt) > nowMs)
    .map((record) => {
      const target = (record.input as { id?: unknown } | null)?.id;
      return {
        id: `approval.requested:${record.approvalId}`,
        kind: "approval.requested",
        titleKey: "notifications.kinds.approvalRequested.title",
        bodyKey: "notifications.kinds.approvalRequested.body",
        params: { capability: record.capabilityId, target: typeof target === "string" ? target : "" },
        createdAt,
        link: { entity: "approval", id: record.approvalId },
      };
    });
}

const kindKey = (kind: Notification["kind"]): string => {
  switch (kind) {
    case "approval.requested":
      return "approvalRequested";
    case "booking.soon":
      return "bookingSoon";
    case "booking.late":
      return "bookingLate";
    case "booking.new":
      return "bookingNew";
  }
};
