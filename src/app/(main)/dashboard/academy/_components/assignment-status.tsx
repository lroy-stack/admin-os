"use client";

import { useMemo } from "react";

import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { assignmentCounts } from "./academy-data";
import { academyMessageKey } from "./messages";

function SubmittedLegendIcon() {
  return <span className="bg-chart-3 block size-2 rounded-[2px]" />;
}

function PendingLegendIcon() {
  return <span className="bg-chart-2 block size-2 rounded-[2px]" />;
}

function OverdueLegendIcon() {
  return <span className="bg-destructive block size-2 rounded-[2px]" />;
}

function AssignmentDotPattern({ color, id }: { color: string; id: string }) {
  return (
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
      <rect width="6" height="6" fill={color} fillOpacity="0.7" />
      <circle cx="1.5" cy="1.5" r="0.8" fill={color} fillOpacity="0.25" />
      <circle cx="4.5" cy="4.5" r="0.8" fill={color} fillOpacity="0.25" />
    </pattern>
  );
}

export function AssignmentStatus() {
  const text = useMessages(academyMessageKey);
  const locale = useLocale();

  const chartConfig = useMemo(
    () =>
      ({
        submitted: { label: text.assignments.submitted, color: "var(--chart-3)", icon: SubmittedLegendIcon },
        pending: { label: text.assignments.pending, color: "var(--chart-2)", icon: PendingLegendIcon },
        overdue: { label: text.assignments.overdue, color: "var(--destructive)", icon: OverdueLegendIcon },
      }) satisfies ChartConfig,
    [text],
  );
  const chartData = useMemo(
    () =>
      assignmentCounts.map((row) => ({
        className: format(text.classCode, locale, { section: `11${row.section}` }),
        submitted: row.submitted,
        pending: row.pending,
        overdue: row.overdue,
      })),
    [text, locale],
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{text.assignments.title}</CardTitle>
        <CardAction className="text-muted-foreground flex items-center gap-1 text-xs">
          {text.assignments.viewReport} <ArrowRight className="size-4" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
            <defs>
              <AssignmentDotPattern color="var(--color-submitted)" id="assignment-submitted-pattern" />
              <AssignmentDotPattern color="var(--color-pending)" id="assignment-pending-pattern" />
              <AssignmentDotPattern color="var(--color-overdue)" id="assignment-overdue-pattern" />
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis axisLine={false} dataKey="className" tickLine={false} tickMargin={10} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            <ChartLegend content={<ChartLegendContent className="flex-wrap justify-start" />} verticalAlign="top" />
            <Bar
              dataKey="submitted"
              fill="url(#assignment-submitted-pattern)"
              radius={4}
              stroke="var(--color-submitted)"
              strokeOpacity={0.45}
              strokeWidth={0.5}
            />
            <Bar
              dataKey="pending"
              fill="url(#assignment-pending-pattern)"
              radius={4}
              stroke="var(--color-pending)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
            <Bar
              dataKey="overdue"
              fill="url(#assignment-overdue-pattern)"
              radius={4}
              stroke="var(--color-overdue)"
              strokeOpacity={0.5}
              strokeWidth={0.5}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
