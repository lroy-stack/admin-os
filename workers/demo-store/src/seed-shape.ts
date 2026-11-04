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

/**
 * A stable fingerprint (FNV-1a) of the seeds' structure. A saved session was written against one structure, so when
 * this changes `SCHEMA_VERSION` must be bumped; a test pins both together and fails until they move as one.
 */
export function seedShapeHash(seeds: Readonly<Record<string, unknown>>): string {
  const text = Object.keys(seeds)
    .sort()
    .map((name) => `${name}=${shapeOf(seeds[name])}`)
    .join(";");
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return hash.toString(16);
}
