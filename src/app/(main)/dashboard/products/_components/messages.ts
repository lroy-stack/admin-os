import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

/** Text of /dashboard/products: the page's title and the accessible name of the toggle between its views. */
export interface ProductsMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  /** The accessible name of the toggle between the views the business offers. */
  readonly viewsLabel: string;
}

export const productsMessageKey: MessageKey<ProductsMessages> = messageKey<ProductsMessages>("products");
