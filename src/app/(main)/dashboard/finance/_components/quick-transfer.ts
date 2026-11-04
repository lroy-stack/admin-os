/** The amount typed in the quick transfer: a number above zero, or `null` when the text is not one. */
export function parseTransferAmount(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
