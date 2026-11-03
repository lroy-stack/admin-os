"use client";

import { useMemo } from "react";

import { Controller, useWatch } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { format, formatAmount, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { customers, type OpenStage, team } from "@/data/crm";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";
import { type OpenDeal, openStages } from "@/lib/crm";

import {
  type DealFormInput,
  type DealFormValues,
  dealFormSchema,
  dealToForm,
  emptyDealForm,
  formToFields,
} from "./deal-form";
import type { DealFields } from "./deal-state";
import { dashboardMessageKey } from "./messages";

const PLACEHOLDER_VALUE = "";

export interface DealFormWindowProps {
  /** The deal being edited, or `null` for New deal. */
  deal: OpenDeal | null;
  /** Presets the stage of a new deal (the column's +). */
  stage: OpenStage | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSave: (fields: DealFields) => void;
}

/**
 * New deal and Edit deal: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts from the
 * deal or a blank form. Demo-local: it says so in its footer.
 */
export function DealFormWindow({ deal, stage, open, onOpenChange, returnFocus, onSave }: DealFormWindowProps) {
  const text = useMessages(dashboardMessageKey);
  const form = text.deal.form;
  const locale = useLocale();
  const currency = useCurrency();
  const schema = useMemo(() => dealFormSchema(form.errors), [form.errors]);
  const editing = deal !== null;
  const verb = editing ? form.editVerb : form.createVerb;

  const windowForm = useWindowForm<DealFormInput, DealFormValues>(schema, {
    defaultValues: deal ? dealToForm(deal) : emptyDealForm(stage),
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSave(formToFields(values));
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });
  const { control } = windowForm.form;
  const typedValue = useWatch({ control, name: "value" });
  const amount = Number(typedValue);
  const preview =
    typedValue.trim() !== "" && Number.isFinite(amount) && amount > 0
      ? format(form.valuePreview, locale, { amount: formatAmount(amount, currency, locale, { fractionDigits: 0 }) })
      : undefined;

  return (
    <FormDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={editing ? form.editTitle : form.createTitle}
      description={form.description}
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
        <FormField control={control} name="title" label={form.title} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="customerId" label={form.customer} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <NativeSelect {...field} disabled={readOnly} className="w-full">
              <NativeSelectOption value={PLACEHOLDER_VALUE}>{form.customerPlaceholder}</NativeSelectOption>
              {customers.map((customer) => (
                <NativeSelectOption key={customer.id} value={customer.id}>
                  {customer.company}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={control}
            name="value"
            label={form.value}
            description={preview}
            readOnly={windowForm.awaiting}
          >
            {(field) => <Input {...field} type="number" inputMode="decimal" min={0} step="any" />}
          </FormField>
          <FormField control={control} name="stage" label={form.stage} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {openStages.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {text.stages[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        <FormField control={control} name="closeDate" label={form.closeDate} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} type="date" />}
        </FormField>
        <Controller
          control={control}
          name="ownerIds"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">{form.owners}</FieldLegend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {team.map((member) => (
                  <Field key={member.id} orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`deal-owner-${member.id}`}
                      checked={field.value.includes(member.id)}
                      disabled={windowForm.awaiting}
                      aria-invalid={fieldState.invalid}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked === true ? [...field.value, member.id] : field.value.filter((id) => id !== member.id),
                        )
                      }
                    />
                    <FieldLabel htmlFor={`deal-owner-${member.id}`} className="font-normal">
                      {member.name}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </FieldSet>
          )}
        />
      </form>
    </FormDialog>
  );
}
