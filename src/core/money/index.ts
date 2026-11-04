import { z } from "zod";

export { CURRENCIES, CURRENCY_COOKIE, type Currency, currencyOfRegion, isCurrency, majorUnits } from "./currency";

/** Integer minor units plus an ISO 4217 code: money never travels as a float, and the code is data, not a constant. */
export const moneySchema = z.object({
  amountMinor: z.number().int(),
  currency: z.string().length(3),
});

export type Money = z.infer<typeof moneySchema>;
