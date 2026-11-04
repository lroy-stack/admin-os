"use client";

import { ArrowRight, Clock3, Focus, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, formatNumber, formatPercent, useLocale, useMessages } from "@/core/i18n/client";

import { productivityMessageKey } from "./messages";
import { useProductivity } from "./productivity-provider";
import { scheduledToday } from "./productivity-state";

const WEEK_PROGRESS = 0.68;
const FOCUS_HOURS_REMAINING = 2;

export function SummaryCards() {
  const locale = useLocale();
  const text = useMessages(productivityMessageKey).summary;
  const { state } = useProductivity();
  const scheduledTasks = scheduledToday(state.tasks);
  const summaryCards = [
    {
      key: "today",
      title: text.today,
      value: formatNumber(scheduledTasks, locale),
      description: format(text.tasksScheduled, locale, { count: scheduledTasks }),
      icon: Clock3,
    },
    {
      key: "week",
      title: text.thisWeek,
      value: formatPercent(WEEK_PROGRESS, locale),
      description: text.progress,
      icon: TrendingUp,
    },
    {
      key: "focus",
      title: text.focus,
      value: text.deepWork,
      description: format(text.hoursRemaining, locale, { count: FOCUS_HOURS_REMAINING }),
      icon: Focus,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((item) => (
        <Card key={item.key} className="min-w-0 shadow-xs">
          <CardHeader>
            <CardTitle>
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <div className="bg-muted grid size-7 shrink-0 place-items-center rounded-lg border">
                  <item.icon className="size-4" />
                </div>
                <span className="min-w-0 break-words hyphens-auto">{item.title}</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl leading-tight tracking-tight break-words hyphens-auto">{item.value}</div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-muted-foreground min-w-0 leading-snug tabular-nums">{item.description}</p>
                <ArrowRight className="text-muted-foreground size-4 shrink-0" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
