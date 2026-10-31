import { z } from "zod";

import { ErrorCodes } from "@/core/errors";
import { err, ok, type Result } from "@/core/result";

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

const encodeCursor = (offset: number) => Buffer.from(JSON.stringify({ o: offset })).toString("base64url");

const cursorSchema = z.object({ o: z.number().int().min(0) });

const decodeCursor = (cursor: string): number | undefined => {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")));
    return parsed.success ? parsed.data.o : undefined;
  } catch {
    return undefined;
  }
};

/**
 * One page of an in-memory list, with the opaque `{o: offset}` cursor the mock uses (ADR 0005). A cursor that does
 * not decode is a client error, never a silent first page.
 */
export const paginate = <T>(
  items: readonly T[],
  page: { readonly cursor?: string; readonly limit: number },
): Result<{ items: T[]; nextCursor: string | null }> => {
  const offset = page.cursor === undefined ? 0 : decodeCursor(page.cursor);
  if (offset === undefined) return err(ErrorCodes.invalidInput, "cursor does not decode", { paths: ["cursor"] });
  const end = offset + page.limit;
  return ok({ items: items.slice(offset, end), nextCursor: end < items.length ? encodeCursor(end) : null });
};
