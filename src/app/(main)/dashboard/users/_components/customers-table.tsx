import { cn } from "cn";
import { Star } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTimeAgo } from "@/lib/crm";
import { formatCurrency } from "@/lib/utils";

import { CustomerAvatar, scoreIndicatorClassName } from "./customer-card";
import type { CustomerRow } from "./customers-data";

export function CustomersTable({ customers, starred }: { customers: CustomerRow[]; starred: ReadonlySet<string> }) {
  return (
    <div className="bg-card ring-border glass-surface px-3 py-2 ring-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs font-normal">Customer</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">Segment</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">Open pipeline</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">Last contact</TableHead>
            <TableHead className="text-muted-foreground w-48 text-xs font-normal">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="hover:bg-foreground/5">
              <TableCell>
                <div className="flex items-center gap-3">
                  <CustomerAvatar customer={customer} className="size-8" />
                  <div className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5 font-medium">
                      {customer.name}
                      {starred.has(customer.id) && (
                        <Star className="fill-brand text-brand size-3" aria-label="Starred" />
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {customer.title} · {customer.company}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="bg-foreground/10 rounded-full px-2.5 py-1 text-xs">{customer.segment}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(customer.openPipeline, { noDecimals: true })}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatTimeAgo(customer.lastContact)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Progress
                    value={customer.score}
                    aria-label={`Relationship score ${customer.score}`}
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
