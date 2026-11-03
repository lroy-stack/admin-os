"use client";

import { type ReactNode, useId } from "react";

import {
  type Control,
  Controller,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

import { describedBy, fieldDomIds } from "./window-form-state";

/** What a control needs to be a labelled, described and announced part of a field. */
export type FormControlProps<Values extends FieldValues, Name extends FieldPath<Values>> = ControllerRenderProps<
  Values,
  Name
> & {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
  /** True while the form is held for approval: render the control read-only. */
  readOnly: boolean;
};

export interface FormFieldProps<Values extends FieldValues, Name extends FieldPath<Values>> {
  control: Control<Values>;
  name: Name;
  label: string;
  description?: string;
  /** From `useWindowForm().awaiting`. */
  readOnly?: boolean;
  children: (props: FormControlProps<Values, Name>) => ReactNode;
}

/**
 * A label, a control, an optional description and the field's error, wired the way `ui/field` expects: the label
 * targets the control, `aria-invalid` and `aria-describedby` point at the description and the error, and the error
 * (`role="alert"`) is announced when it appears.
 */
export function FormField<Values extends FieldValues, Name extends FieldPath<Values>>({
  control,
  name,
  label,
  description,
  readOnly = false,
  children,
}: FormFieldProps<Values, Name>) {
  const id = useId();
  const ids = fieldDomIds(id);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          {children({
            ...field,
            id,
            readOnly,
            "aria-invalid": fieldState.invalid,
            "aria-describedby": describedBy(ids, {
              hasDescription: description !== undefined,
              invalid: fieldState.invalid,
            }),
          })}
          {description === undefined ? null : <FieldDescription id={ids.description}>{description}</FieldDescription>}
          {fieldState.invalid ? <FieldError id={ids.error} errors={[fieldState.error]} /> : null}
        </Field>
      )}
    />
  );
}
