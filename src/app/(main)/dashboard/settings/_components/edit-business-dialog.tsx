"use client";

import { type RefObject, useMemo, useRef, useState } from "react";

import { Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BUSINESS_LIMITS, type BusinessDetails, invoiceTaxIds } from "@/core/business";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { FormField, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { FormDialog } from "@/ds/overlays";

import { updateBusinessDetails } from "../actions";
import { type BusinessFormInput, businessFormSchema, toFormInput } from "./business-form";
import { businessSettingsMessageKey } from "./messages";

interface BusinessWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: BusinessDetails;
  returnFocus: RefObject<HTMLElement | null>;
}

/** The form and its state. The opener remounts it per opening, so every opening starts from the saved details. */
function BusinessWindow({ open, onOpenChange, details, returnFocus }: BusinessWindowProps) {
  const text = useMessages(businessSettingsMessageKey);
  const locale = useLocale();
  const schema = useMemo(() => businessFormSchema(text.validation, locale), [text.validation, locale]);
  const save = useCapabilityAction(updateBusinessDetails);

  const windowForm = useWindowForm<BusinessFormInput, BusinessDetails>(schema, {
    defaultValues: toFormInput(details, locale),
    submit: (values) => save.run({ values }),
    onDone: () => {
      toast.success(text.form.saved);
      onOpenChange(false);
    },
  });
  const { form, awaiting } = windowForm;
  const { fields } = text;
  const textField = (name: keyof BusinessFormInput, label: string, type = "text") => (
    <FormField control={form.control} name={name} label={label} readOnly={awaiting}>
      {(props) => <Input {...props} type={type} autoComplete="off" />}
    </FormField>
  );
  const rateField = (name: "gst" | "vat" | "serviceTax", tax: "gst" | "vat" | "service-tax") => (
    <FormField
      control={form.control}
      name={name}
      label={format(fields.rate, locale, { tax: text.taxes[tax] })}
      readOnly={awaiting}
    >
      {(props) => <Input {...props} inputMode="decimal" autoComplete="off" />}
    </FormField>
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={text.form.title}
      description={text.form.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={text.form.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-6">
        <FieldSet className="gap-4">
          <FieldLegend>{text.sections.profile.title}</FieldLegend>
          {textField("tradeName", fields.tradeName)}
          {textField("legalName", fields.legalName)}
          {textField("taxId", fields.taxId)}
          {textField("email", fields.email, "email")}
          {textField("phone", fields.phone, "tel")}
          {textField("website", fields.website)}
          <FormField
            control={form.control}
            name="address"
            label={fields.address}
            description={format(fields.addressHint, locale, { max: BUSINESS_LIMITS.addressLines })}
            readOnly={awaiting}
          >
            {(props) => <Textarea {...props} rows={BUSINESS_LIMITS.addressLines} />}
          </FormField>
        </FieldSet>

        <FieldSet className="gap-4">
          <FieldLegend>{text.sections.payment.title}</FieldLegend>
          {textField("accountHolder", fields.accountHolder)}
          {textField("accountNumber", fields.accountNumber)}
          {textField("bank", fields.bank)}
        </FieldSet>

        <FieldSet className="gap-4">
          <FieldLegend>{text.sections.invoicing.title}</FieldLegend>
          <FormField control={form.control} name="defaultTax" label={fields.defaultTax} readOnly={awaiting}>
            {({ value, onChange, id, readOnly, ...aria }) => (
              <Select value={value} onValueChange={onChange} disabled={readOnly}>
                <SelectTrigger
                  id={id}
                  aria-invalid={aria["aria-invalid"]}
                  aria-describedby={aria["aria-describedby"]}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {invoiceTaxIds.map((tax) => (
                      <SelectItem key={tax} value={tax}>
                        {text.taxes[tax]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </FormField>
          {rateField("vat", "vat")}
          {rateField("gst", "gst")}
          {rateField("serviceTax", "service-tax")}
          <FormField
            control={form.control}
            name="paymentTermsDays"
            label={fields.paymentTerms}
            description={fields.paymentTermsHint}
            readOnly={awaiting}
          >
            {(props) => <Input {...props} inputMode="numeric" autoComplete="off" />}
          </FormField>
        </FieldSet>
      </form>
    </FormDialog>
  );
}

/** The owner's "Edit" button of the business settings and the window it opens (spec 008, ADR 0015 FormDialog). */
export function EditBusinessDetails({ details }: { details: BusinessDetails }) {
  const text = useMessages(businessSettingsMessageKey);
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={opener}
        variant="ghost"
        className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs"
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        <Pencil data-icon="inline-start" />
        {text.edit}
      </Button>
      <BusinessWindow key={opening} open={open} onOpenChange={setOpen} details={details} returnFocus={opener} />
    </>
  );
}
