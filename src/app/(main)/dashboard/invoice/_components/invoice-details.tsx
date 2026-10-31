import * as React from "react";

import { format, parseISO } from "date-fns";
import { CalendarIcon, Hash } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currencyOptions, formatCalendarDate, useLocale, useMessages } from "@/core/i18n/client";
import { dateFnsLocale } from "@/core/i18n/ui";
import { isCurrency } from "@/core/money/client";

import type { InvoiceFormValues } from "./data";
import { invoiceMessageKey } from "./messages";

const dateFields = [
  { id: "issued-date", label: "issued", name: "issuedDate" },
  { id: "payment-due-date", label: "due", name: "paymentDueDate" },
] as const;

export function InvoiceDetails() {
  const text = useMessages(invoiceMessageKey).details;
  const locale = useLocale();
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();

  return (
    <section className="flex flex-col gap-3">
      <FieldGroup>
        <Field className="gap-1" data-invalid={Boolean(errors.referenceNumber)}>
          <FieldLabel className="text-xs" htmlFor="reference-number">
            {text.reference}
          </FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="reference-number"
              aria-invalid={Boolean(errors.referenceNumber)}
              aria-describedby={errors.referenceNumber ? "reference-number-error" : undefined}
              {...register("referenceNumber")}
            />
            <InputGroupAddon align="inline-end">
              <Hash />
            </InputGroupAddon>
          </InputGroup>
          <FieldError id="reference-number-error" errors={[errors.referenceNumber]} />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          {dateFields.map((dateField) => (
            <Controller
              key={dateField.name}
              control={control}
              name={dateField.name}
              render={({ field, fieldState }) => (
                <Field className="gap-1" data-invalid={fieldState.invalid}>
                  <FieldLabel className="text-xs" htmlFor={dateField.id}>
                    {text[dateField.label]}
                  </FieldLabel>
                  <DatePicker id={dateField.id} value={field.value} onChange={field.onChange} />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
        </div>

        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Field className="gap-1">
              <FieldLabel className="text-xs" htmlFor="invoice-currency">
                {text.currency}
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  if (isCurrency(value)) field.onChange(value);
                }}
              >
                <SelectTrigger id="invoice-currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currencyOptions(locale).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>
    </section>
  );
}

function DatePicker({ id, value, onChange }: { id: string; value: string; onChange: (value: string) => void }) {
  const text = useMessages(invoiceMessageKey).details;
  const locale = useLocale();
  const [open, setOpen] = React.useState(false);
  const date = parseDateValue(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          data-empty={!date}
          className="data-[empty=true]:text-muted-foreground w-full justify-between text-left font-normal"
        >
          {date ? formatCalendarDate(value, locale, { dateStyle: "long" }) : <span>{text.pickDate}</span>}
          <CalendarIcon className="text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Calendar
          className="w-full"
          mode="single"
          locale={dateFnsLocale(locale)}
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;

            onChange(format(selectedDate, "yyyy-MM-dd"));
            setOpen(false);
          }}
          defaultMonth={date}
        />
      </PopoverContent>
    </Popover>
  );
}

function parseDateValue(value: string) {
  const date = parseISO(value);

  return Number.isNaN(date.getTime()) ? undefined : date;
}
