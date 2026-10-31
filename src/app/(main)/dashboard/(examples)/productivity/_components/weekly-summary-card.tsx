import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLocale } from "@/config/locale.server";
import { format } from "@/core/i18n/client";

import { productivityMessages } from "./messages.server";

const GOALS_DONE = 4;
const GOALS_TOTAL = 6;

export async function WeeklySummaryCard() {
  const locale = await getLocale();
  const text = productivityMessages[locale];

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>{text.week.title}</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            {text.viewAll}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">{text.week.encouragement}</p>
        <div className="flex flex-col gap-2">
          <div className="font-medium">{format(text.week.goals, locale, { done: GOALS_DONE, count: GOALS_TOTAL })}</div>
          <Progress value={(GOALS_DONE / GOALS_TOTAL) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
