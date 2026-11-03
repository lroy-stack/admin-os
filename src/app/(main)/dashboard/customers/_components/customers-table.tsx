import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMessages } from "@/core/i18n/client";

import { ContactLinks, CustomerAvatar, CustomerTags, useLastVisitText, useSpendText } from "./customer-card";
import type { CustomerRow } from "./directory-model";
import { customerDirectoryMessageKey } from "./messages";

function CustomerTableRow({ customer }: { customer: CustomerRow }) {
  const lastVisit = useLastVisitText(customer);
  const spend = useSpendText(customer);

  return (
    <TableRow className="hover:bg-foreground/5">
      <TableCell>
        <div className="flex items-center gap-3">
          <CustomerAvatar customer={customer} className="size-8" />
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium break-words">{customer.name}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <CustomerTags customer={customer} />
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right tabular-nums">{customer.visits}</TableCell>
      <TableCell className="text-right tabular-nums">{spend}</TableCell>
      <TableCell className="text-muted-foreground">{lastVisit}</TableCell>
      <TableCell>
        <ContactLinks customer={customer} />
      </TableCell>
    </TableRow>
  );
}

export function CustomersTable({ customers }: { customers: readonly CustomerRow[] }) {
  const text = useMessages(customerDirectoryMessageKey);

  return (
    <div className="bg-card ring-border glass-surface px-3 py-2 ring-1">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.customer}</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">{text.table.visits}</TableHead>
            <TableHead className="text-muted-foreground text-right text-xs font-normal">{text.table.spend}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.lastVisit}</TableHead>
            <TableHead className="text-muted-foreground text-xs font-normal">{text.table.contact}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <CustomerTableRow key={customer.id} customer={customer} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
