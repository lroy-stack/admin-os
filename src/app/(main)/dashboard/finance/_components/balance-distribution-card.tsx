"use client";

import { Label, Pie, PieChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPercent, useChartFormatters, useLocale, useMessages } from "@/core/i18n/client";

import { financeMessageKey } from "./messages";

type BalanceKey = "investment" | "main" | "reserve" | "savings";

// Plain numbers are the business's books in the selected currency; nothing is converted.
const balanceData: {
  amount: number;
  key: BalanceKey;
  share: number;
}[] = [
  { amount: 122_540, key: "main", share: 0.522 },
  { amount: 48_320, key: "savings", share: 0.206 },
  { amount: 36_780, key: "investment", share: 0.157 },
  { amount: 27_256, key: "reserve", share: 0.115 },
];

const accountColors: Record<BalanceKey, string> = {
  investment: "var(--chart-1)",
  main: "var(--chart-2)",
  reserve: "var(--chart-3)",
  savings: "var(--chart-4)",
};

const totalBalance = balanceData.reduce((total, item) => total + item.amount, 0);

export function BalanceDistributionCard() {
  const text = useMessages(financeMessageKey).allocation;
  const locale = useLocale();
  const fmt = useChartFormatters();

  const chartConfig = {
    amount: { label: text.balance },
    investment: { color: accountColors.investment, label: text.accounts.investment },
    main: { color: accountColors.main, label: text.accounts.main },
    reserve: { color: accountColors.reserve, label: text.accounts.reserve },
    savings: { color: accountColors.savings, label: text.accounts.savings },
  } satisfies ChartConfig;

  const chartData = balanceData.map((item) => ({
    ...item,
    account: text.accounts[item.key],
    fill: accountColors[item.key],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{text.title}</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel className="w-52" nameKey="account" />}
            />
            <Pie
              cornerRadius={6}
              data={chartData}
              dataKey="amount"
              innerRadius={65}
              nameKey="account"
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                    return null;
                  }

                  return (
                    <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                      <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                        {text.total}
                      </tspan>
                      <tspan
                        className="fill-foreground text-lg font-medium tabular-nums"
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 14}
                      >
                        {fmt.currency(totalBalance)}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <div className="flex min-w-0 flex-col gap-3">
          {chartData.map((item) => (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3" key={item.key}>
              <div className="min-w-0">
                <div className="flex min-w-0 items-start gap-1">
                  <span
                    aria-hidden="true"
                    className="mt-1 h-2 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <p className="text-muted-foreground min-w-0 text-xs break-words hyphens-auto" title={item.account}>
                    {item.account}
                  </p>
                </div>
                <p className="font-medium tabular-nums">{fmt.currency(item.amount)}</p>
              </div>
              <div className="shrink-0 font-medium tabular-nums">
                {formatPercent(item.share, locale, { fractionDigits: 1 })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
