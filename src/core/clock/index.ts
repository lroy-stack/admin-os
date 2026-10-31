import { z } from "zod";

/** The business day a time belongs to (YYYY-MM-DD). A late-night slot stays on the day it opened. */
export const businessDaySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Minutes from midnight of a business day. 1440 is allowed so a slot can end exactly at midnight. */
export const minuteOfDaySchema = z.number().int().min(0).max(1440);

/** Check for `.refine` on any object with a minute window. Kept out of the schemas so they stay `.omit`-able. */
export const endAfterStart = (window: { startMin: number; endMin: number }) => window.endMin > window.startMin;

export const endAfterStartIssue = { message: "endMin must be after startMin", path: ["endMin"] };
