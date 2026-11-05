export const BUSINESS_DAY = "2026-10-31";
export const at = (hours: number, minutes = 0) => hours * 60 + minutes;
export const eur = (amountMinor: number) => ({ amountMinor, currency: "EUR" });
export const text = (en: string, es: string, de: string, fr: string) => ({
  source: en,
  translations: { en, es, de, fr },
});
