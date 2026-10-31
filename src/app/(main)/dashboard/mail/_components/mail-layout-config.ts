import { z } from "zod";

export const MAIL_LAYOUT_COOKIE = "mail_panel_layout";

export const MAIL_LIST_PANEL_ID = "mail-message-list-panel";
export const MAIL_DETAIL_PANEL_ID = "mail-message-detail-panel";

export const DEFAULT_MAIL_LAYOUT = [38, 62] as const;

const layoutSchema = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);

/** The saved panel split, or the default when the cookie is missing or malformed (a cookie is untrusted input). */
export function parseMailLayout(raw: string | undefined): number[] {
  if (raw === undefined) return [...DEFAULT_MAIL_LAYOUT];
  try {
    const parsed = layoutSchema.safeParse(JSON.parse(raw));
    return parsed.success ? [...parsed.data] : [...DEFAULT_MAIL_LAYOUT];
  } catch {
    return [...DEFAULT_MAIL_LAYOUT];
  }
}
