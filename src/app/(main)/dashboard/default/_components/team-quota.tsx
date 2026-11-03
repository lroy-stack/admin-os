import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatPercent } from "@/core/i18n/client";

import { overviewMessages } from "./messages.server";

// Semicircle from left to right; pathLength lets the dash array read as a percentage.
const ARC_PATH = "M 12 64 A 52 52 0 0 1 116 64";

export async function TeamQuota({ won, target, attainment }: { won: number; target: number; attainment: number }) {
  const [locale, currency, messages] = await Promise.all([getLocale(), getCurrency(), getMessages(overviewMessages)]);
  const text = messages.quota;
  const percent = Math.min(100, Math.round(attainment * 100));
  const percentText = formatPercent(percent / 100, locale);
  const compact = { compact: true };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-normal">{text.title}</CardTitle>
        {/* No "Quota options" control: it had no destination and Home is replaced (002 P6.2b), ADR 0015. */}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-end gap-2">
        <div className="relative w-full max-w-48">
          <meter className="sr-only" min={0} max={100} value={percent} aria-label={text.attainment}>
            {percentText}
          </meter>
          <svg viewBox="0 0 128 72" className="w-full" aria-hidden="true">
            <path
              d={ARC_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              className="text-foreground/10"
            />
            <path
              d={ARC_PATH}
              fill="none"
              stroke="currentColor"
              strokeWidth={12}
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${percent} 100`}
              className="text-brand"
            />
          </svg>
          <span className="absolute inset-x-0 bottom-0 text-center text-2xl font-medium tabular-nums">
            {percentText}
          </span>
        </div>
        <p className="text-muted-foreground text-center text-xs">
          {format(text.summary, locale, {
            won: formatAmount(won, currency, locale, compact),
            target: formatAmount(target, currency, locale, compact),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
