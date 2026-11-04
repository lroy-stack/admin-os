"use client";

import { useMemo } from "react";

import { ArrowRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatPercent, type Locale, useLocale, useMessages, weekdayNames } from "@/core/i18n/client";

import { type Highlight, performanceHighlights } from "./academy-data";
import { type AcademyMessages, academyMessageKey } from "./messages";

type HighlightRow = Highlight & { className: string };

function PerformanceHighlightBar({
  height = 0,
  payload,
  width = 0,
  x = 0,
  y = 0,
  text,
  locale,
}: {
  height?: number;
  payload?: HighlightRow;
  width?: number;
  x?: number;
  y?: number;
  text: AcademyMessages;
  locale: Locale;
}) {
  if (!payload) {
    return null;
  }

  const barHeight = Math.min(32, height);
  const barY = y + (height - barHeight) / 2;
  const radius = barHeight / 2;
  const fillWidth = Math.max(width * (payload.score / 100), 86);
  const avatarSize = 22;
  const avatarStart = x + 8;
  const avatarY = barY + (barHeight - avatarSize) / 2 - 1.5;
  const labelX = avatarStart + payload.students.length * 14 + 14;
  const subject = text.performance.subjects[payload.subject];

  return (
    <g>
      <rect
        fill="color-mix(in oklch, var(--color-duration) 18%, transparent)"
        height={barHeight}
        rx={radius}
        width={width}
        x={x}
        y={barY}
      />
      <rect fill="var(--color-duration)" height={barHeight} rx={radius} width={fillWidth} x={x} y={barY} />

      {payload.students.map((student, index) => {
        const avatarX = avatarStart + index * 14;

        return (
          <foreignObject
            height={avatarSize + 4}
            key={student.initials}
            overflow="visible"
            width={avatarSize + 4}
            x={avatarX - 2}
            y={avatarY}
          >
            <Tooltip>
              <TooltipTrigger
                aria-label={student.name}
                className="focus-visible:ring-ring flex size-5 rounded-full outline-none focus-visible:ring-2"
                data-inert-reason="A tooltip target: the student's details open on hover and focus, not on press."
                type="button"
              >
                <Avatar className="bg-muted size-5" size="sm">
                  <AvatarFallback className="text-foreground">{student.initials}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" sideOffset={8}>
                <div className="grid gap-1">
                  <p>{student.name}</p>
                  <p>
                    {format(text.performance.studentLine, locale, {
                      achievement: text.performance.achievements[student.achievement],
                      score: formatPercent(student.score / 100, locale),
                    })}
                  </p>
                  <p>{format(text.performance.classLine, locale, { class: payload.className, subject })}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </foreignObject>
        );
      })}

      <text
        dominantBaseline="middle"
        x={labelX}
        y={barY + barHeight / 2 + 0.5}
        className="fill-primary-foreground text-xs font-medium"
      >
        {subject}
      </text>

      <text
        dominantBaseline="middle"
        fill="var(--foreground)"
        fontSize={11}
        textAnchor="end"
        x={x + width - 10}
        y={barY + barHeight / 2 + 0.5}
        className="font-medium tabular-nums"
      >
        {formatPercent(payload.score / 100, locale)}
      </text>
    </g>
  );
}

export function PerformanceHighlights() {
  const text = useMessages(academyMessageKey);
  const locale = useLocale();

  const chartConfig = useMemo(
    () => ({ duration: { label: text.performance.score, color: "var(--chart-3)" } }) satisfies ChartConfig,
    [text],
  );
  const rows: HighlightRow[] = useMemo(
    () =>
      performanceHighlights.map((row) => ({
        ...row,
        className: format(text.classCode, locale, { section: `11${row.section}` }),
      })),
    [text, locale],
  );
  // The timeline runs Monday to Friday; `weekdayNames` is indexed like Date#getDay(), so Monday is 1.
  const weekdays = useMemo(() => weekdayNames(locale, "short").slice(1, 6), [locale]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm">{text.performance.title}</CardTitle>
        <CardAction className="text-muted-foreground flex items-center gap-1 text-xs">
          {text.performance.viewInsights} <ArrowRight className="size-4" aria-hidden="true" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ bottom: 0, left: 0, right: 8, top: 0 }}>
            <CartesianGrid horizontal={false} strokeDasharray="4 4" />
            <XAxis
              axisLine={false}
              domain={[0, 4]}
              tickFormatter={(value) => weekdays[Number(value)] ?? ""}
              tickLine={false}
              tickMargin={10}
              ticks={[0, 1, 2, 3, 4]}
              type="number"
            />
            <YAxis axisLine={false} dataKey="className" tickLine={false} tickMargin={10} type="category" width={52} />
            <Bar dataKey="start" fill="transparent" stackId="timeline" />
            <Bar
              dataKey="duration"
              shape={<PerformanceHighlightBar text={text} locale={locale} />}
              stackId="timeline"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
