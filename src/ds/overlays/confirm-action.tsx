"use client";

import { type ReactElement, useId, useRef, useState } from "react";

import { Loader2 } from "lucide-react";
import type { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/core/i18n/client";

import type { ActionOutcome } from "../forms";
import { type OverlaysMessages, overlaysMessageKey } from "./messages";
import { useRestoreFocus } from "./use-restore-focus";

export interface ConfirmReason {
  /** Names the field ("Why is it cancelled?"). */
  label: string;
  /** What a valid reason is; its first issue is the text shown under the field. */
  schema: z.ZodType<string>;
}

export interface ConfirmActionProps {
  /** The action, also the label of the confirm button ("Cancel reservation"). */
  verb: string;
  title: string;
  /** What happens, in one or two sentences ("The table is released. This cannot be undone."). */
  consequence: string;
  /** When declared, a valid reason is required before the action can run. */
  reason?: ConfirmReason;
  destructive?: boolean;
  /** Overrides the Cancel label, for questions such as "Keep editing". */
  cancelLabel?: string;
  /** Runs the action. `error` and `invalid` keep the window open with the text; the others close it. */
  onConfirm: (reason: string | undefined) => Promise<ActionOutcome>;
  /** Controlled use. Leave both out to open it with `trigger`. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** The control that opens it; focus returns to it on close. */
  trigger?: ReactElement;
}

export type ConfirmState = { status: "idle" } | { status: "pending" } | { status: "failed"; text: string };

/** The text to show for an outcome that keeps the window open, or `undefined` when the window may close. */
export function failureText(outcome: ActionOutcome, text: OverlaysMessages["confirm"]): string | undefined {
  switch (outcome.status) {
    case "ok":
    case "awaiting_approval":
      return undefined;
    case "error":
      return outcome.text;
    case "invalid":
      return outcome.issues[0]?.message ?? text.invalid;
    default: {
      const unreachable: never = outcome;
      return unreachable;
    }
  }
}

/** The reason as it will be sent, or why it cannot be sent yet. */
export function checkReason(
  reason: ConfirmReason | undefined,
  value: string,
): { valid: true; value: string | undefined } | { valid: false; message: string } {
  if (!reason) return { valid: true, value: undefined };
  const parsed = reason.schema.safeParse(value);
  if (parsed.success) return { valid: true, value: parsed.data };
  return { valid: false, message: parsed.error.issues[0]?.message ?? "" };
}

/**
 * The confirmation of an irreversible or destructive action (ADR 0015). Cancel has the initial focus, so Enter on
 * open never confirms. The confirm button repeats the verb, shows a pending state and cannot run twice. A declared
 * reason must be valid first. An error keeps the window open with its text.
 */
export function ConfirmAction({
  verb,
  title,
  consequence,
  reason,
  destructive = false,
  cancelLabel,
  onConfirm,
  open: openProp,
  onOpenChange,
  trigger,
}: ConfirmActionProps) {
  const text = useMessages(overlaysMessageKey);
  const [innerOpen, setInnerOpen] = useState(false);
  const [state, setState] = useState<ConfirmState>({ status: "idle" });
  const running = useRef<boolean>(false);
  const focus = useRestoreFocus();
  const open = openProp ?? innerOpen;

  const setOpen = (next: boolean) => {
    if (!next) setState({ status: "idle" });
    setInnerOpen(next);
    onOpenChange?.(next);
  };

  const run = async (value: string | undefined) => {
    if (running.current) return;
    running.current = true;
    setState({ status: "pending" });
    let outcome: ActionOutcome;
    try {
      outcome = await onConfirm(value);
    } catch {
      outcome = { status: "error", text: text.confirm.failed, code: "client.threw" };
    } finally {
      running.current = false;
    }
    const failure = failureText(outcome, text.confirm);
    if (failure === undefined) setOpen(false);
    else setState({ status: "failed", text: failure });
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && running.current) return;
        setOpen(next);
      }}
    >
      {trigger ? <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger> : null}
      <AlertDialogContent {...focus}>
        <ConfirmBody
          verb={verb}
          title={title}
          consequence={consequence}
          reason={reason}
          destructive={destructive}
          cancelLabel={cancelLabel ?? text.confirm.cancel}
          state={state}
          pendingText={text.confirm.pending}
          requiredText={text.confirm.reasonRequired}
          onRun={run}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmBody({
  verb,
  title,
  consequence,
  reason,
  destructive,
  cancelLabel,
  state,
  pendingText,
  requiredText,
  onRun,
}: {
  verb: string;
  title: string;
  consequence: string;
  reason: ConfirmReason | undefined;
  destructive: boolean;
  cancelLabel: string;
  state: ConfirmState;
  pendingText: string;
  requiredText: string;
  onRun: (reason: string | undefined) => void;
}) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);
  const ids = { field: useId(), hint: useId(), error: useId() };
  const checked = checkReason(reason, value);
  const pending = state.status === "pending";
  const hint = touched && !checked.valid && checked.message !== "" ? checked.message : requiredText;

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{consequence}</AlertDialogDescription>
      </AlertDialogHeader>
      {reason ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.field}>{reason.label}</Label>
          <Textarea
            id={ids.field}
            value={value}
            aria-invalid={touched && !checked.valid}
            aria-describedby={ids.hint}
            readOnly={pending}
            onChange={(event) => {
              setValue(event.target.value);
              setTouched(true);
            }}
            onBlur={() => setTouched(true)}
          />
          <p id={ids.hint} className={checked.valid ? "sr-only" : "text-muted-foreground text-xs"}>
            {hint}
          </p>
        </div>
      ) : null}
      {state.status === "failed" ? (
        <p id={ids.error} role="alert" className="text-destructive text-sm">
          {state.text}
        </p>
      ) : null}
      <AlertDialogFooter>
        <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          variant={destructive ? "destructive" : "default"}
          disabled={!checked.valid}
          aria-disabled={pending || undefined}
          onClick={(event) => {
            // The window closes only when the action says so: keep it open on pending and on errors.
            event.preventDefault();
            if (checked.valid && !pending) onRun(checked.value);
          }}
        >
          {pending ? <Loader2 aria-hidden className="animate-spin" data-icon="inline-start" /> : null}
          {verb}
        </AlertDialogAction>
      </AlertDialogFooter>
      <span role="status" className="sr-only">
        {pending ? pendingText : null}
      </span>
    </>
  );
}
