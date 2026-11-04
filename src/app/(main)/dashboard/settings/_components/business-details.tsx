import type { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BusinessDetails } from "@/core/business";
import { format, formatPercent, type Locale } from "@/core/i18n/client";

import type { BusinessSettingsMessages } from "./messages";

const TAXED = ["vat", "gst", "service-tax"] as const;

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm break-words">{children}</dd>
    </div>
  );
}

/** A value the business wrote, or a muted "not set" when it left it empty. */
function Value({ value, notSet }: { value: string; notSet: string }) {
  return value === "" ? <span className="text-muted-foreground">{notSet}</span> : value;
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The business details as the documents print them: who the business is, where it is paid and how it bills. */
export function BusinessDetailsView({
  details,
  text,
  locale,
}: {
  details: BusinessDetails;
  text: BusinessSettingsMessages;
  locale: Locale;
}) {
  const profile = details["business.profile"];
  const payment = details["business.payment"];
  const invoicing = details["business.invoicing"];
  const { fields, notSet } = text;
  const terms =
    invoicing.paymentTermsDays === 0
      ? text.terms.onReceipt
      : format(text.terms.days, locale, { count: invoicing.paymentTermsDays });

  return (
    <div className="flex flex-col gap-4">
      <Section title={text.sections.profile.title} description={text.sections.profile.description}>
        <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <Detail label={fields.tradeName}>
            <Value value={profile.tradeName} notSet={notSet} />
          </Detail>
          <Detail label={fields.legalName}>
            <Value value={profile.legalName} notSet={notSet} />
          </Detail>
          <Detail label={fields.taxId}>
            <Value value={profile.taxId} notSet={notSet} />
          </Detail>
          <Detail label={fields.email}>
            <Value value={profile.email} notSet={notSet} />
          </Detail>
          <Detail label={fields.phone}>
            <Value value={profile.phone} notSet={notSet} />
          </Detail>
          <Detail label={fields.website}>
            <Value value={profile.website} notSet={notSet} />
          </Detail>
          <Detail label={fields.address}>
            {profile.addressLines.length === 0 ? (
              <span className="text-muted-foreground">{notSet}</span>
            ) : (
              <span className="flex flex-col">
                {profile.addressLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            )}
          </Detail>
        </dl>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={text.sections.payment.title} description={text.sections.payment.description}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label={fields.accountHolder}>
              <Value value={payment.accountHolder} notSet={notSet} />
            </Detail>
            <Detail label={fields.bank}>
              <Value value={payment.bank} notSet={notSet} />
            </Detail>
            <Detail label={fields.accountNumber}>
              <Value value={payment.accountNumber} notSet={notSet} />
            </Detail>
          </dl>
        </Section>

        <Section title={text.sections.invoicing.title} description={text.sections.invoicing.description}>
          <dl className="grid gap-5 sm:grid-cols-2">
            <Detail label={fields.defaultTax}>{text.taxes[invoicing.defaultTax]}</Detail>
            <Detail label={fields.paymentTerms}>{terms}</Detail>
            {TAXED.map((tax) => (
              <Detail key={tax} label={format(fields.rate, locale, { tax: text.taxes[tax] })}>
                {formatPercent(invoicing.taxRates[tax] / 100, locale, { maxFractionDigits: 2 })}
              </Detail>
            ))}
          </dl>
        </Section>
      </div>
    </div>
  );
}
