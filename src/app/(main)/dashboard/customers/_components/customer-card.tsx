import Link from "next/link";

import { cn } from "cn";
import { Mail, Phone } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton, StatTiles } from "@/ds/components";
import { getInitials } from "@/lib/utils";

import { type CustomerRow, lastVisitText, spendText } from "./directory-model";
import { customerDirectoryMessageKey } from "./messages";

const avatarTones = ["bg-azure", "bg-salmon", "bg-brand", "bg-foreground/85"] as const;

export function customerAvatarTone(id: string) {
  const hash = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return avatarTones[hash % avatarTones.length];
}

/** Where a customer's record page lives (ADR 0020). */
export const customerHref = (id: string) => `/dashboard/customers/${encodeURIComponent(id)}`;

/** The customer's name as a link to the record page; the focus ring shows on keyboard focus only. */
export function CustomerNameLink({ customer, className }: { customer: CustomerRow; className?: string }) {
  return (
    <Link
      href={customerHref(customer.id)}
      className={cn(
        "focus-visible:ring-ring/50 rounded-sm break-words outline-none hover:underline focus-visible:ring-3",
        className,
      )}
    >
      {customer.name}
    </Link>
  );
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

/** Email and call as real links, each only when the customer has that detail. */
export function ContactLinks({ customer, className }: { customer: CustomerRow; className?: string }) {
  const text = useMessages(customerDirectoryMessageKey);
  const locale = useLocale();

  return (
    <div className={cn("flex shrink-0 items-center gap-1.5", className)}>
      {customer.email !== undefined && (
        <CardIconButton
          icon={Mail}
          label={format(text.card.email, locale, { name: customer.name })}
          href={`mailto:${customer.email}`}
          className="size-7"
        />
      )}
      {customer.phone !== undefined && (
        <CardIconButton
          icon={Phone}
          label={format(text.card.call, locale, { name: customer.name })}
          href={`tel:${customer.phone}`}
          className="size-7"
        />
      )}
    </div>
  );
}

/** Status pills (VIP, blocked) then the customer's own tags. */
export function CustomerTags({ customer }: { customer: CustomerRow }) {
  const text = useMessages(customerDirectoryMessageKey);
  return (
    <>
      {customer.vip && <Badge className="bg-brand text-brand-foreground text-[11px]">{text.card.vip}</Badge>}
      {customer.blocked && <Badge variant="destructive">{text.card.blocked}</Badge>}
      {customer.tags.map((tag) => (
        <span key={tag} className="bg-foreground/10 rounded-full px-2.5 py-1 text-[11px] break-words">
          {tag}
        </span>
      ))}
    </>
  );
}

/** The last visit as a calendar date, or the "no visits yet" text. */
export function useLastVisitText(customer: CustomerRow): string {
  const text = useMessages(customerDirectoryMessageKey);
  return lastVisitText(customer, useLocale(), text.card.never);
}

export function useSpendText(customer: CustomerRow): string {
  return spendText(customer, useLocale());
}

export function CustomerCard({ customer }: { customer: CustomerRow }) {
  const text = useMessages(customerDirectoryMessageKey);
  const lastVisit = useLastVisitText(customer);
  const spend = useSpendText(customer);

  return (
    <Card className="gap-4">
      <div className="flex items-start justify-between gap-2 px-(--card-spacing)">
        <CustomerAvatar customer={customer} />
        <ContactLinks customer={customer} />
      </div>

      <div className="flex flex-col gap-0.5 px-(--card-spacing)">
        <h3 className="text-sm font-medium break-words">
          <CustomerNameLink customer={customer} />
        </h3>
      </div>

      <StatTiles
        className="mx-(--card-spacing)"
        items={[
          { label: text.card.visits, value: customer.visits },
          { label: text.card.spend, value: spend },
          { label: text.card.lastVisit, value: lastVisit },
        ]}
      />

      <div className="flex flex-wrap items-center gap-1.5 px-(--card-spacing)">
        <CustomerTags customer={customer} />
      </div>
    </Card>
  );
}
