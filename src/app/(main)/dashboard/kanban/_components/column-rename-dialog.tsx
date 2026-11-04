"use client";

import { useMemo } from "react";

import { z } from "zod";

import { Input } from "@/components/ui/input";
import { useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { QuickDialog, type ReturnFocus } from "@/ds/overlays";

import { kanbanMessageKey } from "./messages";

export interface ColumnRenameWindowProps {
  /** The name the column shows now. */
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSave: (name: string) => void;
}

/** Rename column: a `QuickDialog` with one field (ADR 0015). Demo-local: it says so in its footer. */
export function ColumnRenameWindow({ name, open, onOpenChange, returnFocus, onSave }: ColumnRenameWindowProps) {
  const text = useMessages(kanbanMessageKey).column.rename;
  const schema = useMemo(() => z.object({ name: z.string().trim().min(1, text.nameRequired) }), [text.nameRequired]);

  const windowForm = useWindowForm<{ name: string }, { name: string }>(schema, {
    defaultValues: { name },
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSave(values.name);
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });

  return (
    <QuickDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={text.title}
      description={text.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={text.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={windowForm.form.control} name="name" label={text.label} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
      </form>
    </QuickDialog>
  );
}
