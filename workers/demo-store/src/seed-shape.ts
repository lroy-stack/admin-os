/** The structure of a value without its content: keys of objects, the union of an array's item shapes, typeof otherwise. */
const shapeOf = (value: unknown): string => {
  if (Array.isArray(value)) return `[${[...new Set(value.map(shapeOf))].sort().join("|")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value)
      .map(([key, nested]) => `${key}:${shapeOf(nested)}`)
      .sort()
      .join(",")}}`;
  }
  return value === null ? "null" : typeof value;
};

/** Every row id under a value, with where it sits: a row added to or removed from a collection moves the fingerprint. */
const idsOf = (value: unknown, path: string): string[] => {
  if (Array.isArray(value)) return value.flatMap((item) => idsOf(item, `${path}[]`));
  if (value === null || typeof value !== "object") return [];
  const row = value as Readonly<Record<string, unknown>>;
  const own = typeof row.id === "string" ? [`${path}#${row.id}`] : [];
  return [
    ...own,
    ...Object.keys(row)
      .sort()
      .flatMap((key) => idsOf(row[key], `${path}.${key}`)),
  ];
};

/**
 * A stable fingerprint (FNV-1a) of the seeds: their structure and their row ids, not their other values (ADR 0017 §8).
 * A saved session was written against one set of seeds, so the store's version carries this and resets a session
 * saved against another, whether a module, a collection, a field or a row came or went.
 */
export function seedFingerprint(seeds: Readonly<Record<string, unknown>>): string {
  const names = Object.keys(seeds).sort();
  const text = [
    ...names.map((name) => `${name}=${shapeOf(seeds[name])}`),
    ...names.flatMap((name) => idsOf(seeds[name], name)).sort(),
  ].join(";");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash.toString(16);
}
