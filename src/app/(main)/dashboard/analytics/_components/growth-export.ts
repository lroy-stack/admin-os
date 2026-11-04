import type { CsvColumn } from "@/lib/csv";

import type { GrowthReport } from "./growth-data";
import type { GrowthMessages } from "./messages";

/** One row of the export: a month with its revenue by segment, its new customers and its win rate. */
export interface GrowthExportRow {
  readonly month: string;
  readonly enterprise: number;
  readonly midMarket: number;
  readonly smb: number;
  readonly customers: number;
  readonly winRate: number;
}

export const GROWTH_EXPORT_FILE = "growth-report.csv";

/** The report of the selected period as one row per month. The three series share the same months. */
export function growthExportRows(report: GrowthReport): GrowthExportRow[] {
  return report.segments.map((segment, index) => ({
    month: segment.month,
    enterprise: segment.enterprise,
    midMarket: segment.midMarket,
    smb: segment.smb,
    customers: report.newCustomers[index]?.customers ?? 0,
    winRate: report.winRate[index]?.rate ?? 0,
  }));
}

export function growthCsvColumns(text: GrowthMessages, currency: string): CsvColumn<GrowthExportRow>[] {
  return [
    { header: text.month, value: (row) => row.month },
    { header: `${text.segments.enterprise} (${currency})`, value: (row) => row.enterprise },
    { header: `${text.segments.midMarket} (${currency})`, value: (row) => row.midMarket },
    { header: `${text.segments.smb} (${currency})`, value: (row) => row.smb },
    { header: text.newCustomers.series, value: (row) => row.customers },
    { header: text.winRate.series, value: (row) => row.winRate },
  ];
}
