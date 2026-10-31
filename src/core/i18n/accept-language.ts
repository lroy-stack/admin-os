/** `Accept-Language` language tags ordered by q (ties keep header order); malformed or `q=0` entries are dropped. */
export function languageTagsByPreference(header: string): string[] {
  return header
    .split(",")
    .map((entry, index) => {
      const [tag = "", ...params] = entry.trim().split(";");
      const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      const q = qParam === undefined ? 1 : Number(qParam.slice(2));
      return { tag: tag.trim(), q, index };
    })
    .filter((entry) => entry.tag !== "" && Number.isFinite(entry.q) && entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.tag);
}
