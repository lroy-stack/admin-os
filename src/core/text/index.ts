/** Lowercase text without accents, so a search for "jose" finds "José" and the other way round. */
export const foldText = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/**
 * Drops the spaces, dashes, dots and parentheses people type in a phone, keeping a leading `+` and the digits, and reads
 * a leading `00` international prefix as `+` (`0034 600 000 101` equals `+34600000101`). National formats (a bare
 * `600000101`, a trunk `0`) are not guessed: they stay as typed.
 */
export const normalisePhone = (phone: string): string => {
  const stripped = phone.replace(/[^\d+]/g, "");
  return stripped.startsWith("00") ? `+${stripped.slice(2)}` : stripped;
};
