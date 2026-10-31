import { siBarclays, siBitcoin, siEthereum, siHsbc, siRevolut } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { format, formatAmount, formatNumber } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

// Bank, exchange and device names are brands, so they are data and stay as they are.
const walletCards = [
  { id: 1, bank: "Revolut Premium", last4: "4182", balance: 12450.6, icon: siRevolut },
  { id: 2, bank: "HSBC Bank", last4: "1004", balance: 3200.11, icon: siHsbc },
  { id: 4, bank: "Barclays Bank", last4: "9912", balance: 1450, icon: siBarclays },
];

const cryptoAssets = [
  { id: 1, name: "Bitcoin", vault: "Binance", quantity: 0.42, ticker: "BTC", value: 24150, icon: siBitcoin },
  { id: 2, name: "Ethereum", vault: "MetaMask", quantity: 4.85, ticker: "ETH", value: 12420.1, icon: siEthereum },
];

const PHYSICAL_VAULT = "Ledger Nano X";
const BULLET = " • ";

export async function Wallet() {
  const [text, locale, currency] = await Promise.all([getMessages(financeMessages), getLocale(), getCurrency()]);
  const labels = text.wallet;
  const amount = (value: number) => formatAmount(value, currency, locale);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{labels.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {walletCards.map((card) => (
            <div key={card.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground text-sm leading-tight font-medium break-words">
                  {[card.bank, `**** ${card.last4}`].join(BULLET)}
                </span>
                <span className="text-muted-foreground text-xs font-normal tabular-nums">{amount(card.balance)}</span>
              </div>
              <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-md border">
                <SimpleIcon icon={card.icon} />
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-4">
          {cryptoAssets.map((asset) => (
            <div key={asset.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-foreground text-sm leading-tight font-medium break-words">
                  {[asset.name, asset.vault].join(BULLET)}
                </span>
                <span className="text-muted-foreground text-xs font-normal tabular-nums">
                  {[
                    format(labels.quantity, locale, {
                      quantity: formatNumber(asset.quantity, locale),
                      ticker: asset.ticker,
                    }),
                    amount(asset.value),
                  ].join(BULLET)}
                </span>
              </div>
              <div className="bg-background flex size-9 shrink-0 items-center justify-center rounded-md border">
                <SimpleIcon icon={asset.icon} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="text-muted-foreground min-w-0 text-[10px] font-medium break-words">
            {labels.physicalVault} <span className="text-foreground">{PHYSICAL_VAULT}</span>
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            <div className="size-1 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <span className="text-[9px] font-bold tracking-widest text-green-500 uppercase">{labels.airGapped}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
