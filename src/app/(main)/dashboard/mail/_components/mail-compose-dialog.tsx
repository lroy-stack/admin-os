"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";

import type { Mail } from "./data";
import { type MailComposeInput, type MailComposeValues, mailComposeSchema, recipientsOf } from "./mail-compose-form";
import type { MailDraft } from "./mail-state";
import { mailMessageKey } from "./messages";

/** What the window opens with: a blank message, or a message to forward. */
export type ComposeTarget = { kind: "new" } | { kind: "forward"; mail: Mail };

export interface MailComposeWindowProps {
  target: ComposeTarget;
  /** The address the message is sent from. */
  from: { name: string; email: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSend: (draft: MailDraft) => void;
}

/**
 * New email and Forward: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts from a
 * blank form or from the message to forward. Demo-local: sending adds the message to Sent and says so in the footer.
 */
export function MailComposeWindow({ target, from, open, onOpenChange, returnFocus, onSend }: MailComposeWindowProps) {
  const text = useMessages(mailMessageKey).compose;
  const locale = useLocale();
  const schema = useMemo(() => mailComposeSchema(text.errors), [text.errors]);
  const forwarding = target.kind === "forward";

  const windowForm = useWindowForm<MailComposeInput, MailComposeValues>(schema, {
    defaultValues: forwarding
      ? {
          to: "",
          cc: "",
          subject: format(text.forwardSubject, locale, { subject: target.mail.subject }),
          body: format(text.forwardBody, locale, { name: target.mail.from.name, body: target.mail.body }),
        }
      : { to: "", cc: "", subject: "", body: "" },
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSend({
        from,
        to: recipientsOf(values.to),
        cc: recipientsOf(values.cc),
        subject: values.subject,
        body: values.body,
      });
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });
  const { control } = windowForm.form;

  return (
    <FormDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={forwarding ? text.forwardTitle : text.newTitle}
      description={format(text.description, locale, { email: from.email })}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={text.send}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField
          control={control}
          name="to"
          label={text.to}
          description={text.addressesHint}
          readOnly={windowForm.awaiting}
        >
          {({ readOnly, ...field }) => (
            <Input {...field} readOnly={readOnly} type="text" inputMode="email" autoComplete="off" />
          )}
        </FormField>
        <FormField control={control} name="cc" label={text.cc} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <Input {...field} readOnly={readOnly} type="text" inputMode="email" autoComplete="off" />
          )}
        </FormField>
        <FormField control={control} name="subject" label={text.subject} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Input {...field} readOnly={readOnly} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="body" label={text.body} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Textarea {...field} readOnly={readOnly} rows={8} className="min-h-40" />}
        </FormField>
      </form>
    </FormDialog>
  );
}
