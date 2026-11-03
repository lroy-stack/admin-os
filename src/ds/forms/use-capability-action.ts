"use client";

import { useCallback, useState } from "react";

import type { SerializedCallResult } from "@/core/client";
import { useLocale } from "@/core/i18n/client";

import { type ActionOutcome, type ErrorDictionary, toOutcome } from "./outcome";
import { createActionRunner } from "./runner";

/** A route's Server Action built on `runWrite` (`@/config/write-action.server`). */
export type CapabilityAction<Input, Output = unknown> = (
  input: Input,
  attemptKey: string,
) => Promise<SerializedCallResult<Output>>;

export interface CapabilityActionOptions {
  /** The owning module's error texts, tried before the shared defaults. */
  readonly errors?: ErrorDictionary;
}

export interface CapabilityActionHandle<Input, Output = unknown> {
  /**
   * Resolves to the outcome, or to `null` when another submit is still pending and this one was refused (nothing was
   * sent; the window keeps showing its pending state).
   */
  readonly run: (input: Input) => Promise<ActionOutcome<Output> | null>;
  readonly pending: boolean;
}

/**
 * Writes through one capability from a window (ADR 0015): one attempt key per attempt, one submit at a time, and the
 * result turned into what the window shows. A window renders `AwaitingApprovalNotice` itself for `awaiting_approval`.
 */
export function useCapabilityAction<Input, Output = unknown>(
  action: CapabilityAction<Input, Output>,
  options: CapabilityActionOptions = {},
): CapabilityActionHandle<Input, Output> {
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [runner] = useState(() => createActionRunner({ newKey: () => crypto.randomUUID(), onPending: setPending }));
  const { errors } = options;

  const run = useCallback(
    async (input: Input) => {
      const result = await runner.run(action, input);
      return result === null ? null : toOutcome(result, locale, errors);
    },
    [runner, action, errors, locale],
  );

  return { run, pending };
}
