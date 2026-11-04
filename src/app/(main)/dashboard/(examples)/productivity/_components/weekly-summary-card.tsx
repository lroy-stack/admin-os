"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { productivityMessageKey } from "./messages";
import { useProductivity } from "./productivity-provider";

const GOALS_DONE = 4;
const GOALS_PLANNED = 6;

export function WeeklySummaryCard() {
  const text = useMessages(productivityMessageKey).week;
  const locale = useLocale();
  const { state } = useProductivity();
  const total = GOALS_PLANNED + state.extraGoals;

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">{text.encouragement}</p>
        <div className="flex flex-col gap-2">
          <div className="font-medium">{format(text.goals, locale, { done: GOALS_DONE, count: total })}</div>
          <Progress value={(GOALS_DONE / total) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
