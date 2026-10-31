"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus, X } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { currencySymbol, format, formatNumber, useCurrency, useLocale, useMessages } from "@/core/i18n/client";

import { categories, statuses } from "./data";
import { productsMessageKey } from "./messages";
import { ProductImagesField } from "./product-images-field";
import { createProductSchema, type ProductFormValues } from "./product-schema";

export function AddProductDrawer() {
  const text = useMessages(productsMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const schema = useMemo(() => createProductSchema(text.validation, locale, currency), [text, locale, currency]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      description: "",
      images: [],
      sku: "",
      category: "clothing",
      status: "draft",
      price: "",
      stock: "0",
    },
  });
  const { errors } = form.formState;

  return (
    <Drawer
      direction="right"
      onOpenChange={(open) => {
        if (!open) form.reset();
      }}
    >
      <DrawerTrigger asChild>
        <Button size="sm">
          <PackagePlus data-icon="inline-start" />
          {text.addProduct}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-lg">
        <DrawerHeader className="shrink-0 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <DrawerTitle>{text.form.addTitle}</DrawerTitle>
              <DrawerDescription>{text.form.addDescription}</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon-sm" className="shrink-0" aria-label={text.form.closeAdd}>
                <X />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={form.handleSubmit(() => undefined)}>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="add-product-name">{text.form.name}</FieldLabel>
                <Input
                  id="add-product-name"
                  placeholder={text.form.namePlaceholder}
                  autoComplete="off"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "add-product-name-error" : undefined}
                  {...form.register("name")}
                />
                {errors.name && <FieldError id="add-product-name-error">{errors.name.message}</FieldError>}
              </Field>
              <Field data-invalid={!!errors.description}>
                <FieldLabel htmlFor="add-product-description">{text.form.description}</FieldLabel>
                <Textarea
                  id="add-product-description"
                  rows={4}
                  className="max-h-48 min-h-24"
                  placeholder={text.form.descriptionPlaceholder}
                  aria-invalid={!!errors.description}
                  aria-describedby={errors.description ? "add-product-description-error" : undefined}
                  {...form.register("description")}
                />
                {errors.description && (
                  <FieldError id="add-product-description-error">{errors.description.message}</FieldError>
                )}
              </Field>
              <Controller
                name="images"
                control={form.control}
                defaultValue={[]}
                render={({ field, fieldState }) => (
                  <ProductImagesField
                    files={field.value}
                    inputRef={field.ref}
                    onBlur={field.onBlur}
                    error={fieldState.error?.message}
                    onChange={(files) => {
                      form.setValue("images", files, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                    }}
                  />
                )}
              />
              <Field data-invalid={!!errors.sku}>
                <FieldLabel htmlFor="add-product-sku">{text.form.sku}</FieldLabel>
                <Input
                  id="add-product-sku"
                  placeholder={text.form.skuPlaceholder}
                  autoComplete="off"
                  aria-invalid={!!errors.sku}
                  aria-describedby={errors.sku ? "add-product-sku-error" : undefined}
                  {...form.register("sku")}
                />
                {errors.sku && <FieldError id="add-product-sku-error">{errors.sku.message}</FieldError>}
              </Field>
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-product-category">{text.form.category}</FieldLabel>
                      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="add-product-category"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "add-product-category-error" : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {text.categories[category]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError id="add-product-category-error">{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="add-product-status">{text.form.status}</FieldLabel>
                      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="add-product-status"
                          ref={field.ref}
                          onBlur={field.onBlur}
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                          aria-describedby={fieldState.error ? "add-product-status-error" : undefined}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {statuses.map((status) => (
                              <SelectItem key={status} value={status}>
                                {text.statuses[status]}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError id="add-product-status-error">{fieldState.error.message}</FieldError>
                      )}
                    </Field>
                  )}
                />
                <Field data-invalid={!!errors.price}>
                  <FieldLabel htmlFor="add-product-price">
                    {format(text.form.price, locale, { symbol: currencySymbol(currency, locale) })}
                  </FieldLabel>
                  <Input
                    id="add-product-price"
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    placeholder={formatNumber(0, locale, { minimumFractionDigits: 2 })}
                    aria-invalid={!!errors.price}
                    aria-describedby={errors.price ? "add-product-price-error" : undefined}
                    {...form.register("price")}
                  />
                  {errors.price && <FieldError id="add-product-price-error">{errors.price.message}</FieldError>}
                </Field>
                <Field data-invalid={!!errors.stock}>
                  <FieldLabel htmlFor="add-product-stock">{text.form.stock}</FieldLabel>
                  <Input
                    id="add-product-stock"
                    type="number"
                    min="0"
                    max="1000000"
                    step="1"
                    aria-invalid={!!errors.stock}
                    aria-describedby={errors.stock ? "add-product-stock-error" : undefined}
                    {...form.register("stock")}
                  />
                  {errors.stock && <FieldError id="add-product-stock-error">{errors.stock.message}</FieldError>}
                </Field>
              </FieldGroup>
              {form.formState.isSubmitSuccessful && form.formState.isValid && (
                <FieldDescription role="status">{text.form.valid}</FieldDescription>
              )}
            </FieldGroup>
          </div>
          <DrawerFooter className="shrink-0 border-t sm:flex-row sm:justify-end">
            <DrawerClose asChild>
              <Button type="button" variant="outline">
                {text.form.cancel}
              </Button>
            </DrawerClose>
            <Button type="submit">{text.form.validate}</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
