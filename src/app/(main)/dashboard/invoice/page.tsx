import { LocaleBundles } from "@/app/_components/locale-root";
import { getCurrency, getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { businessClockSchema } from "@/core/clock";
import { isAwaitingApproval } from "@/core/result";

import { createDefaultInvoice } from "./_components/data";
import { Invoice } from "./_components/invoice";
import { invoiceBundle, invoiceMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/invoice", invoiceMessages);

export default async function Page() {
  const [locale, currency, { client }] = await Promise.all([getLocale(), getCurrency(), getRuntime()]);
  const text = invoiceMessages[locale];
  // The day is the business's (clock capability, ADR 0005), not the server's, which runs in UTC.
  const answer = await client.call("clock.get", {});
  if (isAwaitingApproval(answer) || !answer.ok) {
    throw new Error("The business clock is unavailable.");
  }
  const { today } = businessClockSchema.parse(answer.value);
  // The demo document is seeded on the server in the request's language and the business currency.
  const initialInvoice = createDefaultInvoice(today, currency, text.demoItems);

  return (
    <LocaleBundles bundles={[invoiceBundle]}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl leading-none font-medium tracking-tight">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>
        </div>

        {/* A new language or currency reseeds the demo document, so its text and amounts never mix. */}
        <Invoice key={`${locale}-${currency}`} initialInvoice={initialInvoice} />
      </div>
    </LocaleBundles>
  );
}
