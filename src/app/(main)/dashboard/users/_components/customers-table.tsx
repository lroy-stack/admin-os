import { cn } from "cn";
import { Star } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatAmount, formatRelative, useCurrency, useLocale, useMessages } from "@/core/i18n/client";

import { CustomerAvatar, scoreIndicatorClassName } from "./customer-card";
import { CUSTOMERS_AS_OF, type CustomerRow } from "./customers-data";
import { customerDirectoryMessageKey } from "./messages";

export function CustomersTable({ customers, starred }: { customers: CustomerRow[]; starred: ReadonlySet<string> }) {
  const text = useMessages(customerDirectoryMessageKey);
  const locale = useLocale();
  const currency = useCurrency();

  return (
    <div className="bg-card ring-border glass-surface px-3 py-2 ring-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.customer}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.segment}</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">
              {text.table.openPipeline}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.lastContact}</TableHead>
            <TableHead className="text-muted-foreground w-48 text-xs font-normal">{text.table.score}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-foreground/5">
              <TableCell>
                <div className="flex items-center gap-3">
                  <CustomerAvatar customer={customer} className="size-8" />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5 font-medium break-words">
                      {customer.name}
                      {starred.has(customer.id) && (
                        <Star className="fill-brand text-brand size-3" aria-label={text.table.starred} />
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs break-words hyphens-auto">
                      {`${customer.title} · ${customer.company}`}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="bg-foreground/10 rounded-full px-2.5 py-1 text-xs">
                  {text.segments[customer.segment]}
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatAmount(customer.openPipeline, currency, locale, { fractionDigits: 0 })}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelative(new Date(customer.lastContact), CUSTOMERS_AS_OF, locale)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Progress
                    value={customer.score}
                    aria-label={format(text.card.score, locale, { score: customer.score })}
                    className={cn("bg-foreground/10 h-1", scoreIndicatorClassName(customer.score))}
                  />
                  <span className="text-muted-foreground w-6 text-xs tabular-nums">{customer.score}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
