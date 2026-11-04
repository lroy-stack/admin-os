import { Separator } from "@/components/ui/separator";

import { ClientSelector } from "./client-selector";
import type { InvoiceToDetails } from "./data";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";

export function InvoiceForm({ clients }: { clients: readonly InvoiceToDetails[] }) {
  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
      <InvoiceDetails />

      <Separator />

      <ClientSelector clients={clients} />

      <Separator />

      <InvoiceItems />

      <Separator />

      <InvoiceAdjustments />
    </div>
  );
}
