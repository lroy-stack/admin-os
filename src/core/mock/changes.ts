const sortedKeys = (value: object): string[] => Object.keys(value).sort();

const isContainer = (value: unknown): value is object => typeof value === "object" && value !== null;

const show = (value: unknown): string => (value === undefined ? "absent" : JSON.stringify(value));

/**
 * The paths where `after` differs from `before`, each with the value it had and the one it has, sorted. Objects
 * compare by key and arrays by index; a subtree that appears or disappears is one line. Two equal states give `[]`.
 */
export function changesBetween(before: unknown, after: unknown, path = ""): string[] {
  if (isContainer(before) && isContainer(after) && Array.isArray(before) === Array.isArray(after)) {
    const keys = [...new Set([...sortedKeys(before), ...sortedKeys(after)])];
    return keys.flatMap((key) =>
      changesBetween(
        (before as Record<string, unknown>)[key],
        (after as Record<string, unknown>)[key],
        path === "" ? key : `${path}.${key}`,
      ),
    );
  }
  const was = show(before);
  const now = show(after);
  return was === now ? [] : [`${path}: ${was} -> ${now}`];
}
