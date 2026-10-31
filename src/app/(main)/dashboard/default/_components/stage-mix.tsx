import { cn } from "cn";
import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount } from "@/core/i18n/client";
import type { OpenStage } from "@/data/crm";
import { CardIconButton, toneSolid } from "@/ds/components";

import { dashboardMessages } from "../../_components/messages.server";
import { stageTones } from "../../_components/stage-tones";
import { overviewMessages } from "./messages.server";

export async function StageMix({ stages }: { stages: { stage: OpenStage; count: number; value: number }[] }) {
  const [locale, currency, text, shared] = await Promise.all([
    getLocale(),
    getCurrency(),
    getMessages(overviewMessages),
    getMessages(dashboardMessages),
  ]);
  const total = stages.reduce((sum, item) => sum + item.value, 0);
  const count = stages.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.stageMix.title}</CardTitle>
        <CardAction>
          <CardIconButton icon={ArrowUpRight} label={text.stageMix.openPipeline} href="/dashboard/crm" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-medium tracking-tight tabular-nums">
            {formatAmount(total, currency, locale, { fractionDigits: 0 })}
          </span>
          <span className="text-muted-foreground text-xs">{format(text.stageMix.openAcross, locale, { count })}</span>
        </div>
        <div className="flex h-2.5 gap-1" role="img" aria-label={text.stageMix.chartLabel}>
          {stages.map((item) => (
            <span
              key={item.stage}
              className={cn("rounded-full", toneSolid[stageTones[item.stage]])}
              style={{ flexGrow: item.value }}
            />
          ))}
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          {stages.map((item) => (
            <li key={item.stage} className="flex items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", toneSolid[stageTones[item.stage]])} />
              <span className="text-muted-foreground">{shared.stages[item.stage]}</span>
              <span className="ml-auto tabular-nums">
                {formatAmount(item.value, currency, locale, { compact: true })}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
