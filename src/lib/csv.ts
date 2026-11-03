export type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<Row> {
  readonly header: string;
  readonly value: (row: Row) => CsvCell;
}

/** First characters a spreadsheet reads as a formula (OWASP CSV injection), full-width forms included. */
const FORMULA_START = /^[=+\-@\t\r\n＝＋－＠]/;
const NEEDS_QUOTES = /[",\r\n]/;

function field(cell: CsvCell): string {
  const text = cell === null || cell === undefined ? "" : String(cell);
  // Numbers are data, not text a spreadsheet could execute: only strings are guarded.
  const guarded = typeof cell === "string" && FORMULA_START.test(text);
  const safe = guarded ? `'${text}` : text;
  return guarded || NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** RFC 4180 text with CRLF line endings: a header row, then one row per item. Safe to open in a spreadsheet. */
export function toCsv<Row>(rows: readonly Row[], columns: readonly CsvColumn<Row>[]): string {
  const header = columns.map((column) => field(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => field(column.value(row))).join(","));
  return [header, ...body].join("\r\n");
}

/** Saves CSV text as a file in the browser. The BOM makes spreadsheet apps read accents as UTF-8. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
