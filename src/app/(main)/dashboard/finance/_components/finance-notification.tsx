import { TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { getLocale, getMessages } from "@/config/locale.server";
import { format } from "@/core/i18n/client";

import { financeMessages } from "./messages.server";

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
        <Button size="sm" variant="outline">
          {text.notification.action}
        </Button>
      </ItemActions>
    </Item>
  );
}
