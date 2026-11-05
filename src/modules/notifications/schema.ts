import { z } from "zod";

import { businessDaySchema, minuteOfDaySchema } from "@/core/clock";

export const notificationKinds = ["booking.soon", "booking.late", "booking.new"] as const;

/** A moment on the business clock: the business day and the minute counted from its midnight. */
export const notificationMomentSchema = z.object({ day: businessDaySchema, minute: minuteOfDaySchema });

/** The record a notification concerns, so the panel can open it. */
export const notificationLinkSchema = z.object({ entity: z.string().min(1), id: z.string().min(1) });

/**
 * A notification is data plus message keys, never rendered text, so every locale and preset vocabulary can word it.
 * `titleKey` and `bodyKey` resolve in the `notifications` dictionary; `params` fill their placeholders.
 */
export const notificationSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(notificationKinds),
  titleKey: z.string().min(1),
  bodyKey: z.string().min(1),
  params: z.record(z.string(), z.union([z.string(), z.number()])),
  createdAt: notificationMomentSchema,
  /** Absent while unread. */
  readAt: notificationMomentSchema.optional(),
  link: notificationLinkSchema.optional(),
});

const idsInput = z.array(z.string().min(1).max(128)).min(1).max(100);

export const notificationsReadInput = z.strictObject({ ids: idsInput });

/** `upTo` bounds a read-all to the notifications at or before one the caller saw, so later arrivals stay unread. */
export const notificationsReadAllInput = z.strictObject({ upTo: z.string().min(1).max(128).optional() });

export const unreadCountOutput = z.object({ unreadCount: z.number().int().nonnegative() });

/** `marked` counts the notifications this call turned from unread to read; ids already read or unknown add nothing. */
export const notificationsReadOutput = unreadCountOutput.extend({ marked: z.number().int().nonnegative() });

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationKind = (typeof notificationKinds)[number];
export type NotificationMoment = z.infer<typeof notificationMomentSchema>;
