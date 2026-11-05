"use client";

import { useMemo, useRef } from "react";

import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { type CapabilityActionOptions, FormField, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";
import { partyKinds, partyRoles } from "@/modules/parties";

import { createParty, updateParty } from "../actions";
import type { PartyRow } from "./directory-model";
import { partyDirectoryMessageKey } from "./messages";
import {
  EMPTY_PARTY,
  type PartyFormInput,
  type PartyFormValues,
  partyFormSchema,
  toCreateInput,
  toForm,
  toUpdateInput,
} from "./party-form";

export interface PartyFormWindowProps {
  /** The party being edited, or `null` for Add party. */
  party: PartyRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  errors: CapabilityActionOptions["errors"];
}

/**
 * Add party and Edit party: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts
 * from the party or from a blank form.
 */
export function PartyFormWindow({ party, open, onOpenChange, returnFocus, errors }: PartyFormWindowProps) {
  const text = useMessages(partyDirectoryMessageKey);
  const labels = text.form;
  const locale = useLocale();
  const schema = useMemo(() => partyFormSchema(labels.invalid), [labels.invalid]);
  const options = errors === undefined ? {} : { errors };
  const create = useCapabilityAction(createParty, options);
  const update = useCapabilityAction(updateParty, options);
  const editing = party !== null;
  const copy = editing ? text.edit : text.create;

  const submittedName = useRef("");
  const windowForm = useWindowForm<PartyFormInput, PartyFormValues>(schema, {
    defaultValues: party === null ? EMPTY_PARTY : toForm(party),
    submit: (values) => {
      submittedName.current = values.legalName;
      return party === null ? create.run(toCreateInput(values)) : update.run(toUpdateInput(party.id, values));
    },
    onDone: () => {
      toast.success(format(copy.done, locale, { name: submittedName.current }));
      onOpenChange(false);
    },
  });
  const { control } = windowForm.form;
  const readOnly = windowForm.awaiting;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={editing ? text.edit.title : text.create.verb}
      description={copy.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={copy.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={control} name="legalName" label={labels.legalName} readOnly={readOnly}>
          {(props) => <Input {...props} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="tradeName" label={labels.tradeName} readOnly={readOnly}>
          {(props) => <Input {...props} autoComplete="off" />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={control} name="kind" label={labels.kind} readOnly={readOnly}>
            {({ readOnly: locked, ...props }) => (
              <NativeSelect {...props} disabled={locked} className="w-full">
                {partyKinds.map((kind) => (
                  <NativeSelectOption key={kind} value={kind}>
                    {text.kind[kind]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="taxId" label={labels.taxId} readOnly={readOnly}>
            {(props) => <Input {...props} autoComplete="off" />}
          </FormField>
        </div>
        <FormField
          control={control}
          name="addressLines"
          label={labels.address}
          description={labels.addressHint}
          readOnly={readOnly}
        >
          {(props) => <Textarea {...props} autoComplete="off" rows={3} />}
        </FormField>
        <FormField
          control={control}
          name="countryCode"
          label={labels.countryCode}
          description={labels.countryHint}
          readOnly={readOnly}
        >
          {(props) => <Input {...props} autoComplete="off" maxLength={2} className="uppercase" />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={control} name="email" label={labels.email} readOnly={readOnly}>
            {(props) => <Input {...props} type="email" inputMode="email" autoComplete="off" />}
          </FormField>
          <FormField
            control={control}
            name="phone"
            label={labels.phone}
            description={labels.phoneHint}
            readOnly={readOnly}
          >
            {(props) => <Input {...props} type="tel" inputMode="tel" autoComplete="off" />}
          </FormField>
        </div>
        <Controller
          control={control}
          name="roles"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid}>
              <FieldLegend variant="label">{labels.roles}</FieldLegend>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {partyRoles.map((role) => (
                  <Field key={role} orientation="horizontal" className="w-auto">
                    <Checkbox
                      id={`party-role-${role}`}
                      checked={field.value.includes(role)}
                      disabled={readOnly}
                      aria-invalid={fieldState.invalid}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked === true ? [...field.value, role] : field.value.filter((r) => r !== role),
                        )
                      }
                    />
                    <FieldLabel htmlFor={`party-role-${role}`} className="font-normal">
                      {text.roleName[role]}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </FieldSet>
          )}
        />
        <FormField control={control} name="notes" label={labels.notes} readOnly={readOnly}>
          {(props) => <Textarea {...props} rows={2} />}
        </FormField>
      </form>
    </FormDialog>
  );
}
