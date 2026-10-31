import { Save, Send } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Button } from "@/components/ui/button";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { createDefaultInvoice } from "./_components/data";
import { Invoice } from "./_components/invoice";
import { invoiceBundle, invoiceMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/invoice", invoiceMessages);

export default async function Page() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = invoiceMessages[locale];
  // The demo document is seeded on the server in the request's language and the business currency.
  const initialInvoice = createDefaultInvoice(new Date(), currency, text.demoItems);

  return (
    <LocaleBundles bundles={[invoiceBundle]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline">
              <Save data-icon="inline-start" />
              {text.actions.saveDraft}
            </Button>
            <Button type="button">
              <Send data-icon="inline-start" />
              {text.actions.send}
            </Button>
          </div>
        </div>

        {/* A new language or currency reseeds the demo document, so its text and amounts never mix. */}
        <Invoice key={`${locale}-${currency}`} initialInvoice={initialInvoice} />
      </div>
    </LocaleBundles>
  );
}
