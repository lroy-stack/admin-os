/** Lowercase text without accents, so a search for "jose" finds "José" and the other way round. */
export const foldText = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
