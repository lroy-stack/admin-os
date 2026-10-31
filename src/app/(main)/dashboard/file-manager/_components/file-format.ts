import { formatCalendarDate, formatNumber, formatRelative, type Locale } from "@/core/i18n/client";

import { FILES_AS_OF, type FileManagerFile, type FileManagerFolder, type FileRecord, type FolderRecord } from "./data";
import type { FileManagerMessages } from "./messages";

const SIZE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
const TWO_DAYS_MS = 2 * 86_400_000;

/** "8400000" is "8.4 MB" in English and "8,4 Mo" in French: decimal units, one decimal at most. */
export function formatFileSize(bytes: number, locale: Locale): string {
  const exponent = Math.min(SIZE_UNITS.length - 1, Math.max(0, Math.floor(Math.log10(Math.max(bytes, 1)) / 3)));
  return formatNumber(bytes / 1000 ** exponent, locale, {
    style: "unit",
    unit: SIZE_UNITS[exponent],
    unitDisplay: "short",
    maximumFractionDigits: 1,
  });
}

/** Within two days of the workspace's "now" the time reads as elapsed ("12 minutes ago", "yesterday"), else as a date. */
export function formatModified(isoInstant: string, locale: Locale): string {
  const when = new Date(isoInstant);
  const now = new Date(FILES_AS_OF);
  return now.getTime() - when.getTime() < TWO_DAYS_MS
    ? formatRelative(when, now, locale)
    : formatCalendarDate(isoInstant.slice(0, 10), locale, { dateStyle: "medium" });
}

export function toFolderRows(
  records: readonly FolderRecord[],
  names: FileManagerMessages["names"]["folders"],
  locale: Locale,
): FileManagerFolder[] {
  return records.map(({ bytes, updatedAt, ...folder }) => ({
    ...folder,
    name: names[folder.id],
    size: formatFileSize(bytes, locale),
    updated: formatModified(updatedAt, locale),
  }));
}

export function toFileRows(
  records: readonly FileRecord[],
  names: FileManagerMessages["names"]["files"],
  locale: Locale,
): FileManagerFile[] {
  return records.map(({ bytes, modifiedAt, ...file }) => ({
    ...file,
    name: names[file.id],
    size: formatFileSize(bytes, locale),
    modified: formatModified(modifiedAt, locale),
  }));
}
