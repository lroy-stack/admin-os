"use client";

import { useMemo } from "react";

import { Controller, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";

import { type EventFormInput, type EventFormValues, eventFormSchema, formToFields } from "./event-form";
import { calendarMessageKey } from "./messages";
import { type EventFields, eventCalendars } from "./schedule-state";

export interface EventFormWindowProps {
  /** The form's first values: a blank form on a preset, or the event being edited. */
  initial: EventFormInput;
  /** True for Edit event. */
  editing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSave: (fields: EventFields) => void;
}

/**
 * New event and Edit event: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts from
 * the event or a blank form on the preset. Demo-local: it says so in its footer.
 */
export function EventFormWindow({ initial, editing, open, onOpenChange, returnFocus, onSave }: EventFormWindowProps) {
  const text = useMessages(calendarMessageKey);
  const copy = text.event.form;
  const schema = useMemo(() => eventFormSchema(copy.errors), [copy.errors]);

  const windowForm = useWindowForm<EventFormInput, EventFormValues>(schema, {
    defaultValues: initial,
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSave(formToFields(values));
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });
  const { control } = windowForm.form;
  const allDay = useWatch({ control, name: "allDay" });

  return (
    <FormDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={editing ? copy.editTitle : copy.createTitle}
      description={copy.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={editing ? copy.editVerb : copy.createVerb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={control} name="title" label={copy.title} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="calendar" label={text.event.calendar} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <NativeSelect {...field} disabled={readOnly} className="w-full">
              {eventCalendars.map((key) => (
                <NativeSelectOption key={key} value={key}>
                  {text.filter[key]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <Controller
          control={control}
          name="allDay"
          render={({ field }) => (
            <Field orientation="horizontal" className="w-auto">
              <Checkbox
                id="event-all-day"
                checked={field.value}
                disabled={windowForm.awaiting}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <FieldLabel htmlFor="event-all-day" className="font-normal">
                {copy.allDay}
              </FieldLabel>
            </Field>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={control} name="startDate" label={copy.startDate} readOnly={windowForm.awaiting}>
            {(field) => <Input {...field} type="date" />}
          </FormField>
          {allDay ? null : (
            <FormField control={control} name="startTime" label={copy.startTime} readOnly={windowForm.awaiting}>
              {(field) => <Input {...field} type="time" />}
            </FormField>
          )}
          <FormField control={control} name="endDate" label={copy.endDate} readOnly={windowForm.awaiting}>
            {(field) => <Input {...field} type="date" />}
          </FormField>
          {allDay ? null : (
            <FormField control={control} name="endTime" label={copy.endTime} readOnly={windowForm.awaiting}>
              {(field) => <Input {...field} type="time" />}
            </FormField>
          )}
        </div>
        <FormField control={control} name="location" label={copy.location} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="notes" label={copy.notes} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Textarea {...field} readOnly={readOnly} rows={3} />}
        </FormField>
      </form>
    </FormDialog>
  );
}
