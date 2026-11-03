import { ok, type Result } from "@/core/result";

export interface Page<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
}

/** The most items one page of a list capability may hold (`pageInput` of the module). */
export const PAGE_LIMIT = 200;

/** Follows a list's cursor to the end and returns every item, or the first failure. */
export async function readAllPages<T>(readPage: (cursor: string | undefined) => Promise<Result<Page<T>>>) {
  const items: T[] = [];
  let cursor: string | undefined;
  do {
    const page = await readPage(cursor);
    if (!page.ok) return page;
    items.push(...page.value.items);
    cursor = page.value.nextCursor ?? undefined;
  } while (cursor !== undefined);
  return ok(items);
}
