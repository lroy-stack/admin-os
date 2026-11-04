import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { pageInput, pageOutput } from "@/core/pagination";

import {
  notificationSchema,
  notificationsReadAllInput,
  notificationsReadInput,
  notificationsReadOutput,
  unreadCountOutput,
} from "./schema";

export const notificationsList = defineCapability({
  id: "notifications.list",
  summary:
    "The acting user's notifications, newest first, one page at a time, with the unread count of the whole feed. Titles and bodies are message keys with params, not text; links name the record each one concerns.",
  input: pageInput({ defaultLimit: 20, maxLimit: 100 }),
  output: pageOutput(notificationSchema).extend(unreadCountOutput.shape),
  permission: "read:notifications",
  effect: "read",
  riskTier: 1,
});

export const notificationsUnreadCount = defineCapability({
  id: "notifications.unread.count",
  summary: "How many of the acting user's notifications are unread.",
  input: z.strictObject({}),
  output: unreadCountOutput,
  permission: "read:notifications",
  effect: "read",
  riskTier: 1,
});

export const notificationsRead = defineCapability({
  id: "notifications.read",
  summary:
    "Mark notifications as read by id. Ids that are unknown or already read are ignored, so the call is safe to repeat; it answers how many it marked and the unread count left.",
  input: notificationsReadInput,
  output: notificationsReadOutput,
  permission: "update:notifications",
  effect: "write",
  riskTier: 1,
  change: "set",
  idempotency: "target-state",
});

export const notificationsReadAll = defineCapability({
  id: "notifications.read_all",
  summary:
    "Mark the acting user's notifications as read. Pass upTo, the id of the newest notification you saw in notifications.list (its first item): only that one and those created at or before it (to the business clock's minute) are marked, so notifications that arrived since stay unread and a repeat marks nothing new. Without upTo it marks every notification. Fails with notifications.not_found when upTo names none.",
  input: notificationsReadAllInput,
  output: notificationsReadOutput,
  permission: "update:notifications",
  effect: "write",
  riskTier: 1,
  change: "set",
  idempotency: "target-state",
});

export const notificationsCapabilities = {
  "notifications.list": notificationsList,
  "notifications.unread.count": notificationsUnreadCount,
  "notifications.read": notificationsRead,
  "notifications.read_all": notificationsReadAll,
} as const;
