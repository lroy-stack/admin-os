import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatNumber, formatPercent } from "@/core/i18n/client";

import { queueFigures } from "./analytics-data";
import { analyticsV1Messages } from "./messages.server";

export async function ActionsManagerQueue() {
  const [locale, currency, text] = await Promise.all([getLocale(), getCurrency(), getMessages(analyticsV1Messages)]);
  const t = text.queue;
  const priorities = text.ledger.priorities;
  const money = (amount: number) => formatAmount(amount, currency, locale, { fractionDigits: 0 });
  const [escalation, coaching] = queueFigures.mix;

  return (
    <Card className="h-full shadow-xs">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="flex h-full flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <StatCard label={t.actionableDeals} value={formatNumber(queueFigures.actionableDeals, locale)} />
            <StatCard label={t.revenueInPlay} value={money(queueFigures.revenueInPlay)} mono />
            <StatCard label={t.ownersEngaged} value={formatNumber(queueFigures.ownersEngaged, locale)} />
            <StatCard label={t.medianRisk} value={formatNumber(queueFigures.medianRisk, locale)} mono />
          </div>

          <div className="bg-muted/20 space-y-2 rounded-md border px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">{t.interventionMix}</p>
              <Badge variant="outline" className="h-auto px-2 text-[11px] whitespace-normal tabular-nums">
                {format(t.mixBadge, locale, {
                  priority: priorities[escalation.priority],
                  amount: money(escalation.amount),
                })}
              </Badge>
            </div>
            <div className="space-y-1.5">
              {queueFigures.mix.map((row) => (
                <div
                  key={row.priority}
                  className="bg-background/70 flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
                >
                  <span className="min-w-0 text-xs break-words">{priorities[row.priority]}</span>
                  <span className="text-muted-foreground shrink-0 text-right text-xs tabular-nums">
                    {format(t.mixRow, locale, {
                      count: row.deals,
                      share: formatPercent(row.share, locale),
                      amount: money(row.amount),
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-muted/20 space-y-2 rounded-md border px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs">{t.managerFocus}</p>
              <span className="text-muted-foreground text-xs tabular-nums">{t.thisCycle}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <FocusRow
                label={t.coachQueue}
                value={format(t.dealsWithAmount, locale, {
                  count: coaching.deals,
                  amount: money(coaching.amount),
                })}
              />
              <FocusRow
                label={t.primaryOwner}
                value={format(t.ownerDeals, locale, {
                  owner: queueFigures.primaryOwner.name,
                  count: queueFigures.primaryOwner.deals,
                })}
              />
              <FocusRow
                label={t.stalePipeline}
                value={format(t.dealsWithAmount, locale, {
                  count: queueFigures.staleDeals,
                  amount: money(queueFigures.staleAmount),
                })}
              />
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <p className="text-muted-foreground text-xs">{t.nextInterventions}</p>

            {queueFigures.nextInterventions.map((item) => (
              <div key={`${item.priority}-${item.dealId}`} className="space-y-1 rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.dealId}</span>
                  <Badge variant="outline" className="h-auto px-2 text-[11px] whitespace-normal">
                    {priorities[item.priority]}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {format(t.ownerRisk, locale, { owner: item.owner, risk: item.risk })}
                </p>
                <p className="text-xs">{text.ledger.actions[item.priority]}</p>
              </div>
            ))}
          </div>

          <div className="bg-muted/20 flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
            <span className="text-muted-foreground text-xs">{t.noActionMonitor}</span>
            <span className="text-xs font-medium tabular-nums">
              {format(t.dealsCount, locale, { count: queueFigures.noActionDeals })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FocusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background/70 flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5">
      <span className="min-w-0 break-words">{label}</span>
      <span className="text-muted-foreground shrink-0 text-right tabular-nums">{value}</span>
    </div>
  );
}

function StatCard({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-muted/20 min-w-0 rounded-md border px-2.5 py-2">
      <p className="text-muted-foreground text-xs break-words hyphens-auto">{label}</p>
      <p className={mono ? "text-base font-semibold tabular-nums" : "text-base font-semibold"}>{value}</p>
    </div>
  );
}
