import { majorUnits } from "@/core/money/client";
import type { CsvColumn } from "@/lib/csv";
import type { Customer } from "@/modules/customers";

import type { CustomerDirectoryMessages } from "./messages";

/** What the directory needs of a customer: the list's DTO without notes, consent or extensions. */
export interface CustomerRow {
  readonly id: string;
  readonly name: string;
  readonly email?: string;
  readonly phone?: string;
  readonly tags: readonly string[];
  readonly vip: boolean;
  readonly blocked: boolean;
  readonly visits: number;
  readonly spend: { readonly amountMinor: number; readonly currency: string } | null;
  /** ISO date-time of the last visit; null before the first one. */
  readonly lastVisit: string | null;
}

export type StatusFilter = "all" | "vip" | "blocked";
export type SortKey = "name" | "lastVisit" | "visits" | "spend";

export const STATUS_FILTERS: readonly StatusFilter[] = ["all", "vip", "blocked"];
export const SORT_KEYS: readonly SortKey[] = ["name", "lastVisit", "visits", "spend"];

export function toRow(customer: Customer): CustomerRow {
  return {
    id: customer.id,
    name: customer.name,
    ...(customer.email === undefined ? {} : { email: customer.email }),
    ...(customer.phone === undefined ? {} : { phone: customer.phone }),
    tags: customer.tags,
    vip: customer.vip,
    blocked: customer.blocked,
    visits: customer.figures.visits,
    spend: customer.figures.spend,
    lastVisit: customer.figures.lastVisit,
  };
}

export const isSortKey = (value: string): value is SortKey => SORT_KEYS.some((key) => key === value);

const digitsOf = (text: string) => text.replace(/\D/g, "");

function matchesQuery(row: CustomerRow, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  const text = [row.name, row.email ?? "", row.phone ?? "", ...row.tags].join("\n").toLowerCase();
  if (text.includes(needle)) return true;
  // A phone is typed with spaces or dashes; compare the digits when the query has some.
  const digits = digitsOf(needle);
  return digits.length > 0 && digitsOf(row.phone ?? "").includes(digits);
}

const time = (row: CustomerRow) => (row.lastVisit === null ? Number.NEGATIVE_INFINITY : Date.parse(row.lastVisit));

/** The rows that pass the search and the status filter, in the chosen order. Does not change its input. */
export function visibleRows(
  rows: readonly CustomerRow[],
  options: { query: string; status: StatusFilter; sort: SortKey; locale: string },
): CustomerRow[] {
  const comparators: Record<SortKey, (a: CustomerRow, b: CustomerRow) => number> = {
    name: (a, b) => a.name.localeCompare(b.name, options.locale),
    lastVisit: (a, b) => time(b) - time(a),
    visits: (a, b) => b.visits - a.visits,
    spend: (a, b) => (b.spend?.amountMinor ?? -1) - (a.spend?.amountMinor ?? -1),
  };
  return rows
    .filter((row) => options.status === "all" || row[options.status])
    .filter((row) => matchesQuery(row, options.query))
    .toSorted(comparators[options.sort]);
}

/** Columns of the exported file; headers and yes/no come from the dictionary. */
export function csvColumns(text: CustomerDirectoryMessages["csv"]): CsvColumn<CustomerRow>[] {
  const yesNo = (value: boolean) => (value ? text.yes : text.no);
  return [
    { header: text.name, value: (row) => row.name },
    { header: text.email, value: (row) => row.email },
    { header: text.phone, value: (row) => row.phone },
    { header: text.tags, value: (row) => row.tags.join("; ") },
    { header: text.vip, value: (row) => yesNo(row.vip) },
    { header: text.blocked, value: (row) => yesNo(row.blocked) },
    { header: text.visits, value: (row) => row.visits },
    { header: text.spend, value: (row) => (row.spend ? majorUnits(row.spend.amountMinor, row.spend.currency) : null) },
    { header: text.currency, value: (row) => row.spend?.currency },
    { header: text.lastVisit, value: (row) => row.lastVisit?.slice(0, 10) },
  ];
}
