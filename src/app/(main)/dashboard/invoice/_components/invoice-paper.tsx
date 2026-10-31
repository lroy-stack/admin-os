import { format, formatAmount, formatCalendarDate, formatPercent, useLocale, useMessages } from "@/core/i18n/client";

import {
  getInvoiceDiscount,
  getInvoiceItems,
  getInvoiceSubtotal,
  getInvoiceTax,
  getInvoiceTaxOption,
  getInvoiceTotal,
  getLineAmount,
  INVOICE_PAPER_HEIGHT,
  INVOICE_PAPER_WIDTH,
  type InvoiceFormValues,
} from "./data";
import { invoiceMessageKey } from "./messages";

export function InvoicePaper({ invoice }: { invoice: InvoiceFormValues }) {
  const text = useMessages(invoiceMessageKey);
  const paper = text.paper;
  const locale = useLocale();
  const taxOption = getInvoiceTaxOption(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discountLabel =
    invoice.discountType === "percent"
      ? format(paper.discountPercent, locale, { percent: formatPercent(discountValue / 100, locale) })
      : paper.discount;
  const money = (value: number) => formatAmount(Number.isFinite(value) ? value : 0, invoice.currency, locale);
  const labelled = (label: string, value: string) => format(paper.labelled, locale, { label, value });
  const day = (isoDate: string) => formatCalendarDate(isoDate, locale, { dateStyle: "medium" });

  return (
    <article
      style={{ width: INVOICE_PAPER_WIDTH, height: INVOICE_PAPER_HEIGHT }}
      data-print-paper
      className="relative flex flex-col gap-24 bg-neutral-50 px-12.25 py-11 font-mono text-neutral-950"
    >
      <header className="flex flex-col gap-10">
        <div className="grid grid-cols-2 items-start gap-14">
          <svg className="size-12" viewBox="0 0 48 48" aria-hidden="true">
            <rect width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect y="28" width="20" height="20" rx="3" fill="currentColor" />
            <rect x="28" y="28" width="20" height="20" rx="3" fill="currentColor" />
          </svg>
          <h2 className="text-4xl tracking-widest uppercase">{paper.invoice}</h2>
        </div>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p>{labelled(paper.reference, invoice.referenceNumber)}</p>
            <p>{labelled(paper.issued, day(invoice.issuedDate))}</p>
            <p>{labelled(paper.paymentDue, day(invoice.paymentDueDate))}</p>
          </div>
          <div>
            <p>{paper.paymentAccount}</p>
            <p>{invoice.from.paymentAccountName}</p>
            <p>
              {paper.routingNumber} {invoice.from.routingNumber}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <div>
            <p className="mb-4 font-semibold uppercase">{paper.from}</p>
            <p>{invoice.from.name}</p>
            {invoice.from.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>{labelled(paper.taxId, invoice.from.taxId)}</p>
          </div>
          <div>
            <p className="mb-4 font-semibold uppercase">{paper.billTo}</p>
            <p>{invoice.to.name}</p>
            {invoice.to.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p>{labelled(paper.taxId, invoice.to.taxId)}</p>
          </div>
        </section>
      </header>

      <div className="flex flex-col gap-5">
        <section className="text-sm">
          <div className="grid grid-cols-[1fr_74px_116px_116px] bg-stone-200 px-3 py-3 font-semibold uppercase">
            <span>{paper.description}</span>
            <span className="text-right">{paper.units}</span>
            <span className="text-right">{paper.unitCost}</span>
            <span className="text-right">{paper.lineTotal}</span>
          </div>
          {getInvoiceItems(invoice).map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_74px_116px_116px] border-b border-[oklch(0.86_0_0)] px-3 py-4"
            >
              <span>{item.description}</span>
              <span className="text-right">{item.quantity}</span>
              <span className="text-right">{money(item.unitPrice)}</span>
              <span className="text-right">{money(getLineAmount(item))}</span>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-2 gap-14 text-sm leading-relaxed">
          <section className="col-start-2 space-y-2">
            <div>
              <div className="flex justify-between gap-8">
                <span>{paper.netAmount}</span>
                <span>{money(getInvoiceSubtotal(invoice))}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>{discountLabel}</span>
                <span>{money(getInvoiceDiscount(invoice))}</span>
              </div>
              <div className="flex justify-between gap-8">
                <span>
                  {format(paper.taxLine, locale, {
                    tax: text.taxes[taxOption.id],
                    rate: formatPercent(taxOption.rate / 100, locale),
                  })}
                </span>
                <span>{money(getInvoiceTax(invoice))}</span>
              </div>
            </div>
            <div className="border-y-2 border-current py-3">
              <div className="flex justify-between gap-8">
                <span className="font-semibold uppercase">{paper.balanceDue}</span>
                <span className="font-semibold">{money(getInvoiceTotal(invoice))}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <footer className="absolute right-12.25 bottom-11 left-12.25 grid grid-cols-2 gap-14 text-sm leading-relaxed text-neutral-500">
        <div>
          <p>{invoice.from.email}</p>
          <p>{invoice.from.phone}</p>
          <p>{invoice.from.website}</p>
        </div>
        <div>
          <p>{paper.promptProcessing}</p>
          <p>{format(paper.issuedBy, locale, { name: invoice.from.issuerName })}</p>
        </div>
      </footer>
    </article>
  );
}
