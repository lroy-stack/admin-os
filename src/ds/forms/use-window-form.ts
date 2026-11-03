"use client";

import { type FormEvent, useCallback, useId, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type Path,
  type UseFormReturn,
  useForm,
} from "react-hook-form";
import type { z } from "zod";

import type { ActionOutcome } from "./outcome";
import {
  flattenFieldErrors,
  IDLE_STATUS,
  planOutcome,
  registeredFieldNames,
  routeIssues,
  statusAfter,
  type WindowFormStatus,
} from "./window-form-state";

export interface WindowFormOptions<Input extends FieldValues, Output extends FieldValues, O> {
  readonly defaultValues: DefaultValues<Input>;
  /** Writes the parsed values. `null` means the submit was refused because one is in flight: nothing happens. */
  readonly submit: (values: Output) => Promise<ActionOutcome<O> | null>;
  /** Called with the value of an `ok` outcome; the window closes here. */
  readonly onDone?: (value: O) => void;
}

export interface WindowForm<Input extends FieldValues, Output extends FieldValues> {
  readonly form: UseFormReturn<Input, unknown, Output>;
  /** Submits; for a button outside the `<form>` use `formProps.id` as its `form` attribute. */
  readonly onSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  /** Spread on the native `<form>`: Enter submits, browser validation yields to the schema's messages. */
  readonly formProps: {
    readonly id: string;
    readonly noValidate: true;
    readonly onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    readonly "aria-busy": boolean;
  };
  readonly pending: boolean;
  /** Feeds the window's `dirty` prop. False while held for approval: the submitted values are not lost by closing. */
  readonly dirty: boolean;
  /** What the form-level error slot shows: an `error` outcome or an issue that matches no field. */
  readonly formError: string | null;
  /** Held for approval: show `AwaitingApprovalNotice` and render the fields read-only. */
  readonly awaiting: boolean;
}

/**
 * The form of a window (ADR 0015) on react-hook-form with the zod resolver. Schema issues and server `invalid` issues
 * land on their fields by path, an issue with no field becomes the form-level error, and the first invalid field takes
 * focus. One submit at a time. The state each outcome leads to is decided by `planOutcome` (pure, tested).
 */
export function useWindowForm<Input extends FieldValues, Output extends FieldValues, O = unknown>(
  schema: z.ZodType<Output, Input>,
  { defaultValues, submit, onDone }: WindowFormOptions<Input, Output, O>,
): WindowForm<Input, Output> {
  const form = useForm<Input, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues,
    shouldFocusError: true,
  });
  const id = useId();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<WindowFormStatus>(IDLE_STATUS);
  const inFlight = useRef<boolean>(false);
  const { control, setError, setFocus } = form;

  const isField = useCallback((name: string) => registeredFieldNames(control._fields).includes(name), [control]);

  const onValid = useCallback(
    async (values: Output) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setPending(true);
      setStatus((previous) => ({ ...previous, formError: null }));
      try {
        const plan = planOutcome(await submit(values), isField, registeredFieldNames(control._fields));
        if (plan.kind === "issues") {
          for (const { name, message } of plan.fields) setError(name as Path<Input>, { type: "server", message });
          if (plan.focus !== null) setFocus(plan.focus as Path<Input>);
        }
        setStatus((previous) => statusAfter(previous, plan));
        if (plan.kind === "done") onDone?.(plan.value);
      } finally {
        inFlight.current = false;
        setPending(false);
      }
    },
    [submit, onDone, isField, control, setError, setFocus],
  );

  const onInvalid = useCallback(
    (errors: FieldErrors<Input>) => {
      // react-hook-form focuses the first registered field itself; issues with no field would otherwise vanish.
      const routed = routeIssues(flattenFieldErrors(errors), isField, registeredFieldNames(control._fields));
      setStatus({ formError: routed.formError, awaiting: false });
    },
    [isField, control],
  );

  const handle = form.handleSubmit(onValid, onInvalid);
  const onSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      // The native event must not reload the page; a held form takes no new submit.
      event?.preventDefault();
      if (status.awaiting) return;
      await handle();
    },
    [handle, status.awaiting],
  );

  return {
    form,
    onSubmit,
    formProps: { id, noValidate: true, onSubmit, "aria-busy": pending },
    pending,
    dirty: form.formState.isDirty && !status.awaiting,
    formError: status.formError,
    awaiting: status.awaiting,
  };
}
