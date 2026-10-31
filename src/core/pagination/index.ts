import { z } from "zod";

/** Ceiling for any list, whatever a capability asks for (ported from reference). */
export const MAX_PAGE_LIMIT = 200;
export const MAX_CURSOR_LENGTH = 512;

interface PageInputOptions {
  readonly defaultLimit: number;
  readonly maxLimit: number;
}

/** Strict so a client sending `offset` to a cursor list fails loudly instead of being ignored. */
export const pageInput = ({ defaultLimit, maxLimit }: PageInputOptions) => {
  if (maxLimit > MAX_PAGE_LIMIT || defaultLimit > maxLimit || defaultLimit < 1) {
    throw new RangeError(`pageInput needs 1 <= defaultLimit <= maxLimit <= ${MAX_PAGE_LIMIT}`);
  }
  return z.strictObject({
    cursor: z.string().min(1).max(MAX_CURSOR_LENGTH).optional(),
    limit: z.number().int().min(1).max(maxLimit).default(defaultLimit),
  });
};

export const pageOutput = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().max(MAX_CURSOR_LENGTH).nullable() });
