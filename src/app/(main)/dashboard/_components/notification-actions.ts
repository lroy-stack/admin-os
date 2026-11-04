"use server";

import { getRuntime } from "@/config/runtime";
import { runWrite } from "@/config/write-action.server";
import { approvalsErrors } from "@/core/approvals";
import { ErrorCodes } from "@/core/errors";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval } from "@/core/result";
import { notificationSchema } from "@/modules/notifications";
import { notificationsMessages } from "@/modules/notifications/server";

import { type NotificationsAnswer, notificationView } from "./notification-view";

/** The rows of the bell's panel: the panel reads them when it opens, so a page view costs no extra read. */
const PANEL_LIMIT = 20;

export async function loadNotifications(): Promise<NotificationsAnswer> {
  const { client, locale } = await getRuntime();
  const answer = await client.call("notifications.list", { limit: PANEL_LIMIT });
  const failed = (code: string): NotificationsAnswer => ({
    status: "error",
    text: errorText({ code }, approvalsErrors, locale),
  });
  if (isAwaitingApproval(answer)) return failed(ErrorCodes.unavailable);
  if (!answer.ok) return failed(answer.error.code);
  const page = pageOutput(notificationSchema).safeParse(answer.value);
  if (!page.success) return failed(ErrorCodes.invalidOutput);
  return {
    status: "ok",
    items: page.data.items.map((item) => notificationView(item, notificationsMessages[locale], locale)),
  };
}

export async function markNotificationsRead(input: unknown, attemptKey: unknown) {
  return runWrite("notifications.read", input, attemptKey);
}

export async function markAllNotificationsRead(input: unknown, attemptKey: unknown) {
  return runWrite("notifications.read_all", input, attemptKey);
}

export async function approveHeldWrite(input: unknown, attemptKey: unknown) {
  return runWrite("approvals.approve", input, attemptKey);
}

export async function rejectHeldWrite(input: unknown, attemptKey: unknown) {
  return runWrite("approvals.reject", input, attemptKey);
}
