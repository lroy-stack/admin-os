const sortedKeys = (value: object): string[] => Object.keys(value).sort();

const isContainer = (value: unknown): value is object => typeof value === "object" && value !== null;

const show = (value: unknown): string => (value === undefined ? "absent" : JSON.stringify(value));

/** An absent side compares as an empty container of the other side's kind, so its leaves are listed one by one. */
const emptyLike = (value: object): object => (Array.isArray(value) ? [] : {});

/**
 * The paths where `after` differs from `before`, each with the value it had and the one it has, sorted. Objects
 * compare by key and arrays by index. A subtree that appears or disappears is listed leaf by leaf, so a change reads
 * the same whether or not its parent existed: a held write is then not refused because a sibling was created
 * meanwhile. An empty subtree that appears or disappears is one line. Two equal states give `[]`.
 */
export function changesBetween(before: unknown, after: unknown, path = ""): string[] {
  const from = before === undefined && isContainer(after) && sortedKeys(after).length > 0 ? emptyLike(after) : before;
  const to = after === undefined && isContainer(before) && sortedKeys(before).length > 0 ? emptyLike(before) : after;
  if (isContainer(from) && isContainer(to) && Array.isArray(from) === Array.isArray(to)) {
    const keys = [...new Set([...sortedKeys(from), ...sortedKeys(to)])];
    return keys.flatMap((key) =>
      changesBetween(
        (from as Record<string, unknown>)[key],
        (to as Record<string, unknown>)[key],
        path === "" ? key : `${path}.${key}`,
      ),
    );
  }
  const was = show(from);
  const now = show(to);
  return was === now ? [] : [`${path}: ${was} -> ${now}`];
}
