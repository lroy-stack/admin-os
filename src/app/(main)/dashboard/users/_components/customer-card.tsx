import { cn } from "cn";
import { Mail, Phone, Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format, formatAmount, formatRelative, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton, StatTiles } from "@/ds/components";
import { getInitials } from "@/lib/utils";

import { CUSTOMERS_AS_OF, type CustomerRow } from "./customers-data";
import { customerDirectoryMessageKey } from "./messages";

const avatarTones = ["bg-azure", "bg-salmon", "bg-brand", "bg-foreground/85"] as const;

export function customerAvatarTone(id: string) {
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

/** High scores read in the accent, middling in azure, at-risk in salmon. */
export function scoreIndicatorClassName(score: number) {
  if (score >= 75) return "[&_[data-slot=progress-indicator]]:bg-brand";
  if (score >= 50) return "[&_[data-slot=progress-indicator]]:bg-azure";
  return "[&_[data-slot=progress-indicator]]:bg-salmon";
}

export function CustomerAvatar({ customer, className }: { customer: CustomerRow; className?: string }) {
  return (
    <Avatar className={cn("size-9 after:hidden", className)}>
      <AvatarFallback className={cn("text-background text-[11px] font-medium", customerAvatarTone(customer.id))}>
        {getInitials(customer.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function CustomerCard({
  customer,
  starred,
  onToggleStar,
}: {
  customer: CustomerRow;
  starred: boolean;
  onToggleStar: () => void;
}) {
  const text = useMessages(customerDirectoryMessageKey);
  const locale = useLocale();
  const currency = useCurrency();

  return (
    <Card className="gap-4">
      <div className="flex items-start justify-between gap-2 px-(--card-spacing)">
        <CustomerAvatar customer={customer} />
        <Button
          variant="ghost"
          size="icon"
          aria-pressed={starred}
          aria-label={format(starred ? text.card.unstar : text.card.star, locale, { name: customer.name })}
          onClick={onToggleStar}
          className={cn(
            "ring-border size-7 rounded-full ring-1",
            starred
              ? "liquid-glass-brand bg-brand text-brand-foreground hover:bg-brand/90 hover:text-brand-foreground ring-0"
              : "text-foreground/70 hover:bg-foreground/10",
          )}
        >
          <Star className={cn("size-3.5", starred && "fill-current")} />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 px-(--card-spacing)">
        <h3 className="text-sm font-medium break-words">{customer.name}</h3>
        <p className="text-muted-foreground line-clamp-2 text-[11px] break-words hyphens-auto">
          {`${customer.title} · ${customer.company}`}
        </p>
      </div>

      <StatTiles
        className="mx-(--card-spacing)"
        items={[
          {
            label: text.card.openPipeline,
            value: formatAmount(customer.openPipeline, currency, locale, { fractionDigits: 0 }),
          },
          {
            label: text.card.lastContact,
            value: formatRelative(new Date(customer.lastContact), CUSTOMERS_AS_OF, locale),
          },
        ]}
      />

      <div className="flex items-center gap-3 px-(--card-spacing)">
        <Progress
          value={customer.score}
          aria-label={format(text.card.score, locale, { score: customer.score })}
          className={cn("bg-foreground/10 h-1", scoreIndicatorClassName(customer.score))}
        />
        <span className="text-muted-foreground text-[11px] tabular-nums">{customer.score}</span>
      </div>

      <div className="flex items-center justify-between gap-2 px-(--card-spacing)">
        <span className="bg-foreground/10 min-w-0 rounded-full px-2.5 py-1 text-[11px] break-words">
          {text.segments[customer.segment]}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <CardIconButton
            icon={Mail}
            label={format(text.card.email, locale, { name: customer.name })}
            className="size-7"
          />
          <CardIconButton
            icon={Phone}
            label={format(text.card.call, locale, { name: customer.name })}
            className="size-7"
          />
        </div>
      </div>
    </Card>
  );
}
