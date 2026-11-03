import type { SerializedCallResult } from "@/core/client";

import { type Attempt, attemptFor } from "./attempt";
import { isTransportFailure, transportFailure } from "./outcome";

export interface ActionRunnerOptions {
  readonly newKey: () => string;
  /** Called with `true` when a submit starts and `false` when it ends, however it ends. */
  readonly onPending: (pending: boolean) => void;
}

export interface ActionRunner {
  /**
   * Resolves to the serialized result, or to `null` when another submit is still in flight and this one was refused
   * (nothing was sent). A throwing action, or a failure while building the attempt, is a transport failure.
   */
  readonly run: <Input, Output>(
    action: (input: Input, attemptKey: string) => Promise<SerializedCallResult<Output>>,
    input: Input,
  ) => Promise<SerializedCallResult<Output> | null>;
}

/**
 * The state machine behind `useCapabilityAction`, free of React so it can be tested: one submit at a time, and the
 * attempt of a transport failure kept so a retry of the same input reuses its key (ADR 0015).
 */
export function createActionRunner({ newKey, onPending }: ActionRunnerOptions): ActionRunner {
  let inFlight = false;
  let unresolved: Attempt | undefined;

  return {
    async run(action, input) {
      if (inFlight) return null;
      inFlight = true;
      onPending(true);
      try {
        const attempt = attemptFor(unresolved, input, newKey);
        const result = await action(input, attempt.key).catch(() => transportFailure);
        unresolved = isTransportFailure(result) ? attempt : undefined;
        return result;
      } catch {
        unresolved = undefined;
        return transportFailure;
      } finally {
        inFlight = false;
        onPending(false);
      }
    },
  };
}
