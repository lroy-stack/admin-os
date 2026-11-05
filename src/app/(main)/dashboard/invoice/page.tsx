import Link from "next/link";

import { Building2 } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Button } from "@/components/ui/button";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { createDefaultInvoice } from "./_components/data";
import { Invoice } from "./_components/invoice";
import { loadInvoiceSeed } from "./_components/load-invoice.server";
import { invoiceBundle, invoiceMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/invoice", invoiceMessages);

export default async function Page() {
  const [locale, currency] = await Promise.all([getLocale(), getCurrency()]);
  const text = invoiceMessages[locale];
  // The document starts from the business settings, the client parties and the session's catalog (specs 008, 011).
  const seed = await loadInvoiceSeed(currency);
  const initialInvoice = createDefaultInvoice(seed);

  return (
    <LocaleBundles bundles={[invoiceBundle]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>
          <Button
            asChild
            variant="ghost"
            className="liquid-glass hover:bg-foreground/10 h-8 w-fit rounded-full px-3 text-xs"
          >
            <Link prefetch={false} href="/dashboard/settings">
              <Building2 data-icon="inline-start" />
              {text.businessDetails}
            </Link>
          </Button>
        </div>

        {/* A new language or currency reseeds the demo document, so its text and amounts never mix. */}
        <Invoice key={`${locale}-${currency}`} initialInvoice={initialInvoice} clients={seed.clients} />
      </div>
    </LocaleBundles>
  );
}
