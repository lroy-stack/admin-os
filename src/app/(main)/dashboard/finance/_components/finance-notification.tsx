import { TrendingUp } from "lucide-react";

import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { getLocale, getMessages } from "@/config/locale.server";
import { format, formatCalendarDate, formatNumber } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";
import { ScoreHistoryButton } from "./score-history-button";

/** The score at the start of each month; the last is the one the notification reports. */
const SCORE_HISTORY = [
  { month: "2025-09-01", score: 741 },
  { month: "2025-10-01", score: 752 },
  { month: "2025-11-01", score: 760 },
  { month: "2025-12-01", score: 768 },
  { month: "2026-01-01", score: 782 },
] as const;

export async function FinanceNotification() {
  const [text, locale] = await Promise.all([getMessages(financeMessages), getLocale()]);
  const title = text.notification.title;

  return (
    <Item className="rounded-xl" variant="outline">
      <ItemMedia variant="icon">
        <TrendingUp />
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="line-clamp-2 block w-full break-words hyphens-auto" title={title}>
          {title}
        </ItemTitle>
        <ItemDescription>{format(text.notification.description, locale, { count: 14, score: 782 })}</ItemDescription>
      </ItemContent>
      <ItemActions className="shrink-0 self-start">
        <ScoreHistoryButton
          label={text.notification.action}
          entries={SCORE_HISTORY.map((entry) => ({
            month: formatCalendarDate(entry.month, locale, { month: "long", year: "numeric" }),
            score: formatNumber(entry.score, locale),
          }))}
        />
      </ItemActions>
    </Item>
  );
}
