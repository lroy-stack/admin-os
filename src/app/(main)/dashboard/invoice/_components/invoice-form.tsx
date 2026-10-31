import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessages } from "@/core/i18n/client";

import { ClientSelector } from "./client-selector";
import { InvoiceAdjustments } from "./invoice-adjustments";
import { InvoiceDetails } from "./invoice-details";
import { InvoiceItems } from "./invoice-items";
import { invoiceMessageKey } from "./messages";

export function InvoiceForm() {
  const text = useMessages(invoiceMessageKey).tabs;

  return (
    <div className="bg-card flex flex-col gap-4 rounded-xl border p-4">
      <Tabs defaultValue="invoice">
        <TabsList className="w-full">
          <TabsTrigger value="invoice">{text.invoice}</TabsTrigger>
          <TabsTrigger value="payment">{text.payment}</TabsTrigger>
          <TabsTrigger value="business">{text.business}</TabsTrigger>
        </TabsList>
      </Tabs>

      <InvoiceDetails />

      <Separator />

      <ClientSelector />

      <Separator />

      <InvoiceItems />

      <Separator />

      <InvoiceAdjustments />
    </div>
  );
}
