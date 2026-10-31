import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { cn } from "cn";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { format, formatAmount, useLocale, useMessages } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";

import { getLineAmount, type InvoiceFormValues, type InvoiceLineItem } from "./data";
import { invoiceMessageKey } from "./messages";

export function InvoiceItems() {
  const text = useMessages(invoiceMessageKey).items;
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<InvoiceFormValues>();
  const { append, fields, move, remove } = useFieldArray({
    control,
    name: "items",
    keyName: "fieldKey",
  });
  const items = useWatch({ control, name: "items" }) ?? [];
  const currency = useWatch({ control, name: "currency" });
  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;

    if (event.canceled || !isSortable(source) || source.initialIndex === source.index) {
      return;
    }

    move(source.initialIndex, source.index);
  }

  function handleAddItem() {
    append({ id: `item-${Date.now()}`, description: "", quantity: 1, unitPrice: 0 });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium tracking-tight">{text.title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={handleAddItem}>
          <Plus data-icon="inline-start" />
          {text.add}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground hidden items-center gap-2 px-1 text-xs font-medium md:grid md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]">
          <span />
          <span>{text.description}</span>
          <span className="px-2">{text.units}</span>
          <span className="px-2">{text.unitCost}</span>
          <span className="text-right">{text.lineTotal}</span>
          <span />
        </div>

        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <SortableInvoiceItemRow
                key={field.id}
                id={field.id}
                index={index}
                item={items[index]}
                register={register}
                currency={currency}
                errors={errors.items?.[index]}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </DragDropProvider>
      </div>
    </section>
  );
}

function SortableInvoiceItemRow({
  id,
  index,
  item,
  register,
  currency,
  errors,
  onRemove,
}: {
  id: string;
  index: number;
  item?: InvoiceLineItem;
  register: UseFormRegister<InvoiceFormValues>;
  currency: Currency;
  errors?: FieldErrors<InvoiceLineItem>;
  onRemove: () => void;
}) {
  const text = useMessages(invoiceMessageKey).items;
  const locale = useLocale();
  const { handleRef, isDragging, ref } = useSortable({
    id,
    index,
    type: "invoice-item",
    accept: "invoice-item",
    group: "invoice-items",
    modifiers: [RestrictToVerticalAxis],
  });

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-0 grid-cols-[24px_minmax(0,0.8fr)_minmax(0,1fr)_32px] items-center gap-2 rounded-lg md:grid-cols-[24px_minmax(0,1fr)_64px_112px_112px_32px]",
        isDragging && "relative z-10 opacity-50",
      )}
    >
      <Button
        ref={handleRef}
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground -ml-2 cursor-grab active:cursor-grabbing"
        aria-label={format(text.reorder, locale, {
          name: item?.description.trim() ? item.description : String(index + 1),
        })}
      >
        <GripVertical />
      </Button>
      <Input
        className="min-w-0 text-sm max-md:col-span-3"
        aria-label={format(text.descriptionOf, locale, { number: index + 1 })}
        aria-invalid={Boolean(errors?.description)}
        {...register(`items.${index}.description` as const)}
      />
      <Input
        type="number"
        step="1"
        className="text-sm max-md:col-start-2 max-md:row-start-2"
        aria-label={format(text.quantityOf, locale, { number: index + 1 })}
        aria-invalid={Boolean(errors?.quantity)}
        {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
      />
      <Input
        type="number"
        step="0.01"
        className="text-sm max-md:col-start-3 max-md:row-start-2"
        aria-label={format(text.unitPriceOf, locale, { number: index + 1 })}
        aria-invalid={Boolean(errors?.unitPrice)}
        {...register(`items.${index}.unitPrice` as const, { valueAsNumber: true })}
      />
      <div className="min-w-0 text-right text-sm font-medium max-md:col-span-3 max-md:col-start-2 max-md:row-start-3 max-md:flex max-md:items-center max-md:justify-between max-md:text-left">
        <span className="text-muted-foreground hidden max-md:inline">{text.lineTotal}</span>
        <span>{formatAmount(safe(getLineAmount(item)), currency, locale)}</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="max-md:col-start-4 max-md:row-start-2"
        aria-label={format(text.remove, locale, { number: index + 1 })}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
      <FieldError className="col-span-full" errors={[errors?.description, errors?.quantity, errors?.unitPrice]} />
    </div>
  );
}

function safe(value: number) {
  return Number.isFinite(value) ? value : 0;
}
