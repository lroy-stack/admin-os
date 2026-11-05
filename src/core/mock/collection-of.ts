/**
 * Another module's seed collection, read through an optional reference (ADR 0017 §3): empty when that module is not
 * installed, so a handler that reads it answers instead of throwing, and an id it cannot find is unknown. Declare the
 * collection optional (`?`) in the handler's data type; `name` must be one of its keys, so a typo does not compile.
 * The result is read-only: a module never writes another module's collection.
 */
/** The rows of an optional collection, read-only. */
type RowsOf<V> = Exclude<V, undefined> extends readonly (infer Row)[] ? readonly Row[] : never;

export const collectionOf = <D extends { readonly [P in K]?: readonly unknown[] }, K extends keyof D>(
  data: D,
  name: K,
): RowsOf<D[K]> => {
  // The constraint makes `data[name]` an optional array, so the rows (or none) are what `RowsOf` names.
  const rows: readonly unknown[] = data[name] ?? [];
  return rows as RowsOf<D[K]>;
};
