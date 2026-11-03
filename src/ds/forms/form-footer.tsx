"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { messageKey, useMessages } from "@/core/i18n/client";
import { AwaitingApprovalNotice } from "@/ds/feedback";

/**
 * The part of the window kit's dictionary (`overlays`, bundled by `overlaysBundle`) that the footer reads. `ds/overlays`
 * does not export its key through its index, so the footer names the namespace and the three strings it uses.
 */
interface FooterMessages {
  readonly confirm: { readonly cancel: string; readonly pending: string };
  readonly window: { readonly demoNote: string };
}
const overlaysMessageKey = messageKey<FooterMessages>("overlays");

export interface FormFooterProps {
  /** The verb of the window title ("Seat walk-in"), repeated on the primary button (ADR 0015). */
  verb: string;
  /** The `<form>` the primary button submits: `useWindowForm().formProps.id`. The footer sits outside the form. */
  formId: string;
  pending: boolean;
  /** The form-level message of `useWindowForm().formError`. */
  error?: string | null;
  /** Closes the window the way Escape does; from the window's `footer` function. */
  onCancel: () => void;
  /** Set while held for approval: names what waits and who decides. The primary button is then unavailable. */
  approval?: { action: string; role: string } | null;
  /** For showcase windows whose data is local. Leave it off when the window itself has `demo` (it shows the note). */
  demo?: boolean;
}

/**
 * The footer of a window form: the form-level error above the buttons in a live region that is always mounted (so a
 * new message is announced once), the approval notice, the demo note, Cancel and the primary submit. While pending the
 * primary button stays focusable (`aria-disabled`, not `disabled`) so focus is not lost, and the form refuses a second
 * submit itself.
 */
export function FormFooter({ verb, formId, pending, error, onCancel, approval, demo = false }: FormFooterProps) {
  const text = useMessages(overlaysMessageKey);
  const held = approval !== null && approval !== undefined;
  const unavailable = pending || held;
  return (
    <div data-slot="form-footer" className="flex w-full flex-col gap-3">
      <div role="alert" data-slot="form-error" className="text-destructive text-sm empty:hidden">
        {error ?? null}
      </div>
      {held ? <AwaitingApprovalNotice variant="inline" action={approval.action} role={approval.role} /> : null}
      {demo ? <p className="text-muted-foreground text-xs">{text.window.demoNote}</p> : null}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {text.confirm.cancel}
        </Button>
        <Button
          type="submit"
          form={formId}
          aria-disabled={unavailable}
          data-pending={pending}
          className="aria-disabled:opacity-50"
        >
          {pending ? <Spinner aria-hidden="true" role="presentation" /> : null}
          {verb}
          {pending ? <span className="sr-only">{text.confirm.pending}</span> : null}
        </Button>
      </div>
    </div>
  );
}
