import { z } from "zod";

import { format, formatAmount, type Locale } from "@/core/i18n/client";
import type { Currency } from "@/core/money/client";

import { categories, statuses } from "./data";
import type { ProductsMessages } from "./messages";

export const productImageTypes = ["image/jpeg", "image/png", "image/webp"];
export const maxProductImageSize = 5 * 1024 * 1024;
export const maxProductImages = 5;

const MAX_NAME = 100;
const MAX_DESCRIPTION = 2000;
const MAX_SKU = 40;
const MAX_PRICE = 1_000_000;
const MAX_STOCK = 1_000_000;

/**
 * The add-product form's schema, built from the dictionary's `validation` messages for one locale and the business
 * currency, so the form and any server that parses the same data report the same sentences.
 */
export function createProductSchema(text: ProductsMessages["validation"], locale: Locale, currency: Currency) {
  const maxMessage = (template: string, max: number | string) => format(template, locale, { max });
  const maxImageMegabytes = maxProductImageSize / (1024 * 1024);

  return z.object({
    name: z.string().trim().min(1, text.nameRequired).max(MAX_NAME, maxMessage(text.nameMax, MAX_NAME)),
    description: z
      .string()
      .trim()
      .min(1, text.descriptionRequired)
      .max(MAX_DESCRIPTION, maxMessage(text.descriptionMax, MAX_DESCRIPTION)),
    images: z
      .array(z.custom<File>((value) => typeof File !== "undefined" && value instanceof File))
      .max(maxProductImages, maxMessage(text.imagesMax, maxProductImages))
      .refine((files) => files.every((file) => productImageTypes.includes(file.type)), text.imageType)
      .refine(
        (files) => files.every((file) => file.size > 0 && file.size <= maxProductImageSize),
        maxMessage(text.imageSize, maxImageMegabytes),
      ),
    sku: z
      .string()
      .trim()
      .min(1, text.skuRequired)
      .max(MAX_SKU, maxMessage(text.skuMax, MAX_SKU))
      .regex(/^[A-Za-z0-9_-]+$/, text.skuPattern),
    category: z.enum(categories),
    status: z.enum(statuses),
    price: z
      .string()
      .min(1, text.priceRequired)
      .regex(/^\d+(\.\d{1,2})?$/, text.pricePattern)
      .refine(
        (value) => Number(value) <= MAX_PRICE,
        maxMessage(text.priceMax, formatAmount(MAX_PRICE, currency, locale, { fractionDigits: 0 })),
      ),
    stock: z
      .string()
      .min(1, text.stockRequired)
      .regex(/^\d+$/, text.stockPattern)
      .refine((value) => Number(value) <= MAX_STOCK, maxMessage(text.stockMax, MAX_STOCK)),
  });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductSchema>>;
