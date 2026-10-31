import { z } from "zod";

export const LOCALES = ["en", "es", "de", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/** The original text plus the translations that exist so far (ADR 0007); a missing locale falls back to `source`. */
export const localizedTextSchema = z.object({
  source: z.string(),
  translations: z.partialRecord(z.enum(LOCALES), z.string()),
});

export type LocalizedText = z.infer<typeof localizedTextSchema>;
