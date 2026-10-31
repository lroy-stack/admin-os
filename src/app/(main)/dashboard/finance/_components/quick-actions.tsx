import {
  Banknote,
  ChevronRight,
  Droplet,
  History,
  Lightbulb,
  MoreHorizontal,
  QrCode,
  SendHorizontal,
  Smartphone,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { getCurrency, getLocale, getMessages } from "@/config/locale.server";
import { currencySymbol, formatNumber } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

const contacts = [
  { id: 1, initials: "AR" },
  { id: 2, initials: "SC" },
  { id: 3, initials: "MJ" },
  { id: 4, initials: "ED" },
];

const shortcuts = [
  { id: "scanQr", icon: QrCode },
  { id: "transfer", icon: SendHorizontal },
  { id: "payBills", icon: Banknote },
  { id: "history", icon: History },
  { id: "mobile", icon: Smartphone },
  { id: "electricity", icon: Lightbulb },
  { id: "water", icon: Droplet },
  { id: "more", icon: MoreHorizontal },
] as const;

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
          <Field orientation="horizontal">
            <InputGroup>
              <InputGroupAddon>
                <InputGroupText>{currencySymbol(currency, locale)}</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                aria-label={labels.amountLabel}
                inputMode="decimal"
                placeholder={formatNumber(0, locale, { minimumFractionDigits: 2 })}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{currency}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <Button className="shrink-0">{labels.send}</Button>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">{labels.shortcutsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <div key={shortcut.id} className="flex min-w-0 flex-col items-center gap-2.5">
                  <Button variant="outline" className="size-12 rounded-full" aria-label={labels.shortcuts[shortcut.id]}>
                    <Icon className="size-5" />
                  </Button>
                  <span className="text-muted-foreground min-w-0 text-center text-xs break-words hyphens-auto">
                    {labels.shortcuts[shortcut.id]}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
