import { ChevronRight } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { currencySymbol, formatNumber } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";
import { QuickShortcuts } from "./quick-shortcuts";
import { QuickTransferForm } from "./quick-transfer-form";

const contacts = [
  { id: 1, initials: "AR" },
  { id: 2, initials: "SC" },
  { id: 3, initials: "MJ" },
  { id: 4, initials: "ED" },
];

export async function QuickActions() {
  const [text, locale, currency] = await Promise.all([getMessages(financeMessages), getLocale(), getCurrency()]);
  const labels = text.quick;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-normal">{labels.transferTitle}</CardTitle>
          <CardAction>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {contacts.map((contact) => (
                  <Avatar key={contact.id} className="border-background size-7 border-2">
                    <AvatarFallback className="text-[10px]">{contact.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <ChevronRight className="size-4" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <QuickTransferForm
            symbol={currencySymbol(currency, locale)}
            currency={currency}
            placeholder={formatNumber(0, locale, { minimumFractionDigits: 2 })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">{labels.shortcutsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickShortcuts />
        </CardContent>
      </Card>
    </div>
  );
}
