"use client";

import { useState } from "react";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, SegmentedControl, type SegmentedOption } from "@/ds/components";

import { getGrowthReport, type Period, periods } from "./growth-data";
import { LeadSources } from "./lead-sources";
import { NewCustomersChart } from "./new-customers-chart";
import { RevenueBySegment } from "./revenue-by-segment";
import { WinRateTrend } from "./win-rate-trend";

const periodOptions: SegmentedOption<Period>[] = periods.map((period) => ({ value: period, label: period }));

export function GrowthReports() {
  const [period, setPeriod] = useState<Period>("6M");
  const report = getGrowthReport(period);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Growth Reports"
        kpis={report.kpis}
        actions={
          <>
            <SegmentedControl label="Report period" value={period} options={periodOptions} onValueChange={setPeriod} />
            <Button className="liquid-glass-brand h-9 rounded-full px-4">
              <Download data-icon="inline-start" />
              Export CSV
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
