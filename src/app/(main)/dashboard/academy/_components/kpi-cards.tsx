import type { ReactNode } from "react";

import { ArrowUp, Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatNumber, formatPercent } from "@/core/i18n/client";

import { assignmentCounts, classesToday } from "./academy-data";
import { academyMessages } from "./messages.server";

const STUDENTS_TAUGHT = 128;

const deltaBadgeClassName =
  "rounded-sm border-green-600/50 bg-green-500/10 px-1 text-xs font-normal text-green-700 dark:border-green-800/50 dark:bg-green-500/15 dark:text-green-300";

function KpiCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="min-w-0 text-sm break-words hyphens-auto">{title}</CardTitle>
        <CardAction>
          <Info className="text-muted-foreground size-3" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">{children}</CardContent>
    </Card>
  );
}

export async function KpiCards() {
  const [text, locale] = await Promise.all([getMessages(academyMessages), getLocale()]);
  const kpis = text.kpis;
  const pending = assignmentCounts.reduce((total, row) => total + row.pending, 0);
  const overdue = assignmentCounts.reduce((total, row) => total + row.overdue, 0);
  const countOf = (status: "inProgress" | "upcoming" | "cancelled") =>
    classesToday.filter((item) => item.status === status).length;

  return (
    <section className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard title={kpis.students}>
          <div className="flex items-center gap-2">
            <span className="text-foreground shrink-0 text-3xl leading-none tracking-tight tabular-nums">
              {formatNumber(STUDENTS_TAUGHT, locale)}
            </span>
            <Badge className={deltaBadgeClassName}>
              <ArrowUp />
              {formatPercent(0.028, locale, { fractionDigits: 1 })}
            </Badge>
          </div>
          <div className="text-muted-foreground text-right text-xs">
            {format(kpis.studentsNote, locale, { count: assignmentCounts.length })}
          </div>
        </KpiCard>

        <KpiCard title={kpis.attendance}>
          <div className="flex items-center gap-2">
            <span className="text-foreground shrink-0 text-3xl leading-none tracking-tight tabular-nums">
              {formatPercent(0.942, locale, { fractionDigits: 1 })}
            </span>
            <Badge className={deltaBadgeClassName}>
              <ArrowUp />
              {formatPercent(0.011, locale, { fractionDigits: 1 })}
            </Badge>
          </div>
          <div className="text-muted-foreground text-right text-xs">{kpis.attendanceNote}</div>
        </KpiCard>

        <KpiCard title={kpis.assignments}>
          <div className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
            {formatNumber(pending + overdue, locale)}
          </div>
          <div className="text-muted-foreground text-right text-xs">
            {format(kpis.assignmentsNote, locale, { pending, overdue })}
          </div>
        </KpiCard>

        <KpiCard title={kpis.classesToday}>
          <div className="text-foreground text-3xl leading-none tracking-tight tabular-nums">
            {formatNumber(classesToday.length, locale)}
          </div>
          <div className="text-muted-foreground text-right text-xs">
            {format(kpis.classesNote, locale, {
              inProgress: countOf("inProgress"),
              upcoming: countOf("upcoming"),
              count: countOf("cancelled"),
            })}
          </div>
        </KpiCard>
      </div>
    </section>
  );
}
