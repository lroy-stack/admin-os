export type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<Row> {
  readonly header: string;
  readonly value: (row: Row) => CsvCell;
}

/** First characters a spreadsheet reads as a formula (OWASP CSV injection), full-width forms included. */
const FORMULA_START = /^[=+\-@\t\r\n＝＋－＠]/;

function field(cell: CsvCell): string {
  const text = cell === null || cell === undefined ? "" : String(cell);
  // Numbers are data, not text a spreadsheet could execute: only strings are guarded.
  const guarded = typeof cell === "string" && FORMULA_START.test(text);
  const safe = guarded ? `'${text}` : text;
  // Always quoted: a quoted field stays one cell whatever separator the reader uses (`;` in es/de/fr, tab, `|`).
  return `"${safe.replaceAll('"', '""')}"`;
}

/** RFC 4180 text with CRLF line endings: a header row, then one row per item. Safe to open in a spreadsheet. */
export function toCsv<Row>(rows: readonly Row[], columns: readonly CsvColumn<Row>[]): string {
  const header = columns.map((column) => field(column.header)).join(",");
  const body = rows.map((row) => columns.map((column) => field(column.value(row))).join(","));
  return [header, ...body].join("\r\n");
}

/** Saves CSV text as a file in the browser. The BOM makes spreadsheet apps read accents as UTF-8. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked after the browser has started the download; doing it in the same tick can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
