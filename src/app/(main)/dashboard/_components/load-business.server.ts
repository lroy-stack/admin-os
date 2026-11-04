import "server-only";

import { z } from "zod";

import { getRuntime } from "@/config/runtime";
import { BUSINESS_KEYS, type BusinessDetails, businessDetailsSchema } from "@/core/business";
import { errorText } from "@/core/i18n";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";

const answerSchema = z.object({ values: businessDetailsSchema });

/** The settings read has no codes of its own to word: the default texts and the error class cover it. */
const NO_OWN_TEXTS = { en: {}, es: {}, de: {}, fr: {} } as const;

export interface LoadedBusinessDetails {
  readonly state: ReadStatus;
  /** The translated reason when the read failed or was refused. */
  readonly reason?: string;
  /** Present when the read succeeded. */
  readonly details?: BusinessDetails;
}

/**
 * The business details in effect for the visitor (spec 008): the preset's company with the owner's changes, read
 * through `settings.values.get` so the demo session's own values apply. The settings page shows them and the invoice
 * prints them.
 */
export async function loadBusinessDetails(): Promise<LoadedBusinessDetails> {
  const { client, locale } = await getRuntime();
  const answer = await client.call("settings.values.get", { keys: [...BUSINESS_KEYS] });
  const state = readStateOf(answer, () => false);
  if (!isAwaitingApproval(answer) && answer.ok) return { state, details: answerSchema.parse(answer.value).values };
  const reason = !isAwaitingApproval(answer) && !answer.ok ? errorText(answer.error, NO_OWN_TEXTS, locale) : undefined;
  return { state, ...(reason === undefined ? {} : { reason }) };
}
