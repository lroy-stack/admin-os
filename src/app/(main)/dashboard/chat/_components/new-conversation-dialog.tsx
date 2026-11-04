"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";

import { channelItems } from "./data";
import { chatMessageKey } from "./messages";
import { type NewConversationInput, type NewConversationValues, newConversationSchema } from "./new-conversation-form";

export interface NewConversationWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onStart: (values: NewConversationValues) => void;
}

/**
 * New conversation: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts blank.
 * Demo-local: starting one adds it to the list and says so in the footer.
 */
export function NewConversationWindow({ open, onOpenChange, returnFocus, onStart }: NewConversationWindowProps) {
  const text = useMessages(chatMessageKey);
  const form = text.newConversation;
  const schema = useMemo(() => newConversationSchema(form.errors), [form.errors]);

  const windowForm = useWindowForm<NewConversationInput, NewConversationValues>(schema, {
    defaultValues: { name: "", email: "", channel: "email", subject: "", message: "" },
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onStart(values);
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
      title={form.title}
      description={form.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={form.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={control} name="name" label={form.name} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Input {...field} readOnly={readOnly} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="email" label={form.email} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <Input {...field} readOnly={readOnly} type="email" inputMode="email" autoComplete="off" />
          )}
        </FormField>
        <FormField control={control} name="channel" label={form.channel} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <NativeSelect {...field} disabled={readOnly} className="w-full">
              {channelItems.map((item) => (
                <NativeSelectOption key={item.id} value={item.id}>
                  {text.channels[item.id]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <FormField control={control} name="subject" label={form.subject} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Input {...field} readOnly={readOnly} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="message" label={form.message} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Textarea {...field} readOnly={readOnly} rows={5} className="min-h-28" />}
        </FormField>
      </form>
    </FormDialog>
  );
}
