"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, QuickDialog, type ReturnFocus } from "@/ds/overlays";

import {
  emptyShowcaseValues,
  type ShowcaseField,
  type ShowcaseFormErrors,
  type ShowcaseValues,
  showcaseFormSchema,
} from "./showcase-form";

export interface ShowcaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the action ("Add environment"); the primary button repeats `verb`. */
  title: string;
  description?: string;
  verb: string;
  fields: readonly ShowcaseField[];
  errors: ShowcaseFormErrors;
  /** The values an edit starts from; a blank form when absent. */
  initial?: ShowcaseValues;
  returnFocus: ReturnFocus;
  /** `quick` for a short task of up to four fields (ADR 0015); `form` (default) for a record. */
  kind?: "quick" | "form";
  /** Receives the trimmed values; the window closes after it returns. */
  onSave: (values: ShowcaseValues) => void;
}

/**
 * A create or edit form for a showcase screen whose data is local (ADR 0015): a `FormDialog` that says so in its
 * footer. The host remounts it per opening (`key`), so every opening starts from the record or a blank form.
 */
export function ShowcaseFormDialog({
  open,
  onOpenChange,
  title,
  description,
  verb,
  fields,
  errors,
  initial,
  returnFocus,
  kind = "form",
  onSave,
}: ShowcaseFormDialogProps) {
  const schema = useMemo(() => showcaseFormSchema(fields, errors), [fields, errors]);
  const windowForm = useWindowForm<ShowcaseValues, ShowcaseValues>(schema, {
    defaultValues: initial ?? emptyShowcaseValues(fields),
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSave(values);
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });
  const { control } = windowForm.form;

  const Window = kind === "quick" ? QuickDialog : FormDialog;

  return (
    <Window
      demo
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
        {fields.map((field) => (
          <FormField
            key={field.name}
            control={control}
            name={field.name}
            label={field.label}
            readOnly={windowForm.awaiting}
          >
            {({ readOnly, ...control }) => {
              if (field.kind === "select") {
                return (
                  <NativeSelect {...control} disabled={readOnly} className="w-full">
                    {field.options?.map((option) => (
                      <NativeSelectOption key={option.value} value={option.value}>
                        {option.label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                );
              }
              if (field.kind === "textarea") return <Textarea {...control} readOnly={readOnly} rows={3} />;
              if (field.kind === "number") {
                return <Input {...control} readOnly={readOnly} type="number" inputMode="decimal" min={0} step="any" />;
              }
              if (field.kind === "date") return <Input {...control} readOnly={readOnly} type="date" />;
              if (field.kind === "time") return <Input {...control} readOnly={readOnly} type="time" />;
              return <Input {...control} readOnly={readOnly} autoComplete="off" />;
            }}
          </FormField>
        ))}
      </form>
    </Window>
  );
}
