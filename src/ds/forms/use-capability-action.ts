"use client";

import { useCallback, useRef, useState } from "react";

import type { SerializedCallResult } from "@/core/client";
import { useLocale } from "@/core/i18n/client";

import { type Attempt, attemptFor } from "./attempt";
import { type ActionOutcome, type ErrorDictionary, isTransportFailure, toOutcome, transportFailure } from "./outcome";

/** A route's Server Action built on `runWrite` (`@/config/write-action.server`). */
export type CapabilityAction<Input> = (input: Input, attemptKey: string) => Promise<SerializedCallResult>;

export interface CapabilityActionOptions {
  /** The owning module's error texts, tried before the shared defaults. */
  readonly errors?: ErrorDictionary;
}

export interface CapabilityActionHandle<Input> {
  /** Resolves to the outcome, or to `null` when another submit is still pending and this one was refused. */
  readonly run: (input: Input) => Promise<ActionOutcome | null>;
  readonly pending: boolean;
}

/**
 * Writes through one capability from a window (ADR 0015): one attempt key per attempt, one submit at a time, and the
 * result turned into what the window shows. A window renders `AwaitingApprovalNotice` itself for `awaiting_approval`.
 */
export function useCapabilityAction<Input>(
  action: CapabilityAction<Input>,
  options: CapabilityActionOptions = {},
): CapabilityActionHandle<Input> {
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const unresolved = useRef<Attempt | undefined>(undefined);
  const { errors } = options;

  const run = useCallback(
    async (input: Input) => {
      if (inFlight.current) return null;
      inFlight.current = true;
      setPending(true);
      const attempt = attemptFor(unresolved.current, input, () => crypto.randomUUID());
      try {
        const result = await action(input, attempt.key).catch(() => transportFailure);
        unresolved.current = isTransportFailure(result) ? attempt : undefined;
        return toOutcome(result, locale, errors);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [action, errors, locale],
  );

  return { run, pending };
}
