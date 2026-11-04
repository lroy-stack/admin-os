import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencySymbol, format, formatPercent, useLocale, useMessages } from "@/core/i18n/client";

import { type InvoiceFormValues, invoiceTaxOptionsOf } from "./data";
import { invoiceMessageKey } from "./messages";

export function InvoiceAdjustments() {
  const text = useMessages(invoiceMessageKey);
  const locale = useLocale();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();
  const [discountType, currency, taxRates] = useWatch({ control, name: ["discountType", "currency", "taxRates"] });

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">{text.adjustments.title}</h2>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Controller
          control={control}
          name="taxId"
          render={({ field }) => (
            <Field className="gap-1">
              <FieldLabel className="text-xs">{text.adjustments.tax}</FieldLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder={text.adjustments.selectTax} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {invoiceTaxOptionsOf(taxRates).map((taxOption) => (
                      <SelectItem key={taxOption.id} value={taxOption.id}>
                        {format(text.paper.taxLine, locale, {
                          tax: text.taxes[taxOption.id],
                          rate: formatPercent(taxOption.rate / 100, locale, { maxFractionDigits: 2 }),
                        })}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />

        <div className="grid grid-cols-[1fr_112px] gap-4">
          <Controller
            control={control}
            name="discountType"
            render={({ field }) => (
              <Field className="gap-1">
                <FieldLabel className="text-xs">{text.adjustments.discount}</FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder={text.adjustments.discountType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="fixed">{text.adjustments.fixed}</SelectItem>
                      <SelectItem value="percent">{text.adjustments.percent}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Field className="gap-1" data-invalid={Boolean(errors.discountValue)}>
            <FieldLabel className="text-xs opacity-0">{text.adjustments.value}</FieldLabel>
            <InputGroup>
              <InputGroupInput
                type="number"
                step="0.01"
                aria-label={text.adjustments.value}
                aria-invalid={Boolean(errors.discountValue)}
                aria-describedby={errors.discountValue ? "discount-value-error" : undefined}
                {...register("discountValue", { valueAsNumber: true })}
              />
              <InputGroupAddon align="inline-end">
                {discountType === "fixed" ? currencySymbol(currency, locale) : "%"}
              </InputGroupAddon>
            </InputGroup>
          </Field>
        </div>
      </div>
      <FieldError id="discount-value-error" errors={[errors.discountValue]} />
    </section>
  );
}
