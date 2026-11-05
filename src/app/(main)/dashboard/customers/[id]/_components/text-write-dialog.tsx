"use client";

import type { z } from "zod";

import { Textarea } from "@/components/ui/textarea";
import {
  type CapabilityAction,
  type CapabilityActionOptions,
  FormField,
  FormFooter,
  useCapabilityAction,
  useWindowForm,
} from "@/ds/forms";
import { QuickDialog, type ReturnFocus } from "@/ds/overlays";

interface TextWriteWindowProps {
  /** The window's title, which names the action and its object. */
  title: string;
  /** The verb on the primary button. */
  verb: string;
  description: string;
  label: string;
  /** The capability's own limit, so typing stops there instead of failing on submit. */
  maxLength: number | undefined;
  schema: z.ZodType<{ text: string }, { text: string }>;
  action: CapabilityAction<unknown>;
  toInput: (values: { text: string }) => unknown;
  errors: CapabilityActionOptions["errors"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  /** Called once the write went through, before the window closes. */
  onSaved: () => void;
}

/** A `QuickDialog` with one required textarea: the note and the reason of a block differ only in words and capability. */
export function TextWriteWindow(props: TextWriteWindowProps) {
  const { title, verb, description, label, maxLength, schema, action, toInput, errors } = props;
  const { open, onOpenChange, returnFocus, onSaved } = props;
  const write = useCapabilityAction(action, errors === undefined ? {} : { errors });
  const windowForm = useWindowForm<{ text: string }, { text: string }>(schema, {
    defaultValues: { text: "" },
    submit: (values) => write.run(toInput(values)),
    onDone: () => {
      onSaved();
      onOpenChange(false);
    },
  });

  return (
    <QuickDialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={title}
      description={description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={windowForm.form.control} name="text" label={label} readOnly={windowForm.awaiting}>
          {(field) => <Textarea {...field} maxLength={maxLength} rows={4} />}
        </FormField>
      </form>
    </QuickDialog>
  );
}
