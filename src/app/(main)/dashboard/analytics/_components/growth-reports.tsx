"use client";

import { useState } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { PageHeader, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { downloadCsv, toCsv } from "@/lib/csv";

import { getGrowthReport, growthKpis, type Period, periods } from "./growth-data";
import { GROWTH_EXPORT_FILE, growthCsvColumns, growthExportRows } from "./growth-export";
import { LeadSources } from "./lead-sources";
import { growthMessageKey } from "./messages";
import { NewCustomersChart } from "./new-customers-chart";
import { RevenueBySegment } from "./revenue-by-segment";
import { WinRateTrend } from "./win-rate-trend";

export function GrowthReports() {
  const text = useMessages(growthMessageKey);
  const locale = useLocale();
  const currency = useCurrency();
  const [period, setPeriod] = useState<Period>("6M");
  const report = getGrowthReport(period);

  const periodLabels: Record<Period, string> = {
    "3M": text.periods.threeMonths,
    "6M": text.periods.sixMonths,
    "12M": text.periods.twelveMonths,
  };
  const periodOptions: SegmentedOption<Period>[] = periods.map((value) => ({ value, label: periodLabels[value] }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={text.title}
        kpis={growthKpis(report, text.kpis, locale, currency)}
        actions={
          <>
            <SegmentedControl
              label={text.periodLabel}
              value={period}
              options={periodOptions}
              onValueChange={setPeriod}
            />
            <Button
              className="liquid-glass-brand h-9 rounded-full px-4"
              onClick={() =>
                downloadCsv(GROWTH_EXPORT_FILE, toCsv(growthExportRows(report), growthCsvColumns(text, currency)))
              }
            >
              <Download data-icon="inline-start" />
              {text.exportCsv}
            </Button>
          </>
        }
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <RevenueBySegment report={report} />
        <LeadSources report={report} />
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <NewCustomersChart report={report} />
        <WinRateTrend report={report} />
      </div>
    </div>
  );
}
