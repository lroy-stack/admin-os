import { WalletMinimal } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { formatAmount } from "@/core/i18n/client";

import { financeV1Messages } from "../messages.server";

export async function PrimaryAccount() {
  const [text, locale, currency] = await Promise.all([getMessages(financeV1Messages), getLocale(), getCurrency()]);
  const labels = text.kpis.primaryAccount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <span className="bg-muted grid size-7 shrink-0 place-content-center rounded-sm">
              <WalletMinimal className="size-5" />
            </span>
            <span className="min-w-0 break-words">{labels.title}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-0.5">
          <p className="text-xl font-medium tabular-nums">
            {formatAmount(12450, currency, locale, { fractionDigits: 0 })}
          </p>

          <p className="text-muted-foreground text-xs">{labels.balance}</p>
        </div>
      </CardContent>
    </Card>
  );
}
