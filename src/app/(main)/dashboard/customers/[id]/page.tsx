import { notFound } from "next/navigation";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { homeLevel } from "@/config/trail.server";
import { textFor } from "@/config/vocabulary.server";
import type { Locale } from "@/core/i18n/client";
import { PageTrail } from "@/ds/components";
import { contactFieldsBundle, customersErrors } from "@/modules/customers/server";

import { customerHref } from "../_components/customer-card";
import { toRow } from "../_components/directory-model";
import { customerDirectoryBundle, customerDirectoryMessages } from "../_components/messages.server";
import { RecordContactLinks } from "./_components/directory-pieces";
import { loadCustomer } from "./_components/load-customer.server";
import { customerRecordBundle, customerRecordMessages } from "./_components/messages.server";
import { RecordActions } from "./_components/record-actions";
import { RecordContact } from "./_components/record-contact";
import { RecordHeader } from "./_components/record-header";
import { attendanceOf, consentOf, contactOf } from "./_components/record-model";
import { RecordNotes } from "./_components/record-notes";
import { RecordOverview } from "./_components/record-overview";
import { RecordReadState } from "./_components/record-read-state";
import { RecordStateColumn } from "./_components/record-state-column";
import { abilitiesOf } from "./_components/record-writes";

const LIST = "/dashboard/customers";

type Params = Promise<{ id: string }>;

/** The page's title is the customer's name; a record page is never indexed (ADR 0020 §1). */
export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const loaded = await loadCustomer(id);
  const named = (locale: Locale) => ({
    meta: {
      ...customerRecordMessages[locale].meta,
      ...(loaded.status === "ready" ? { title: loaded.customer.name } : {}),
    },
  });
  return pageMetadata(
    customerHref(id),
    { en: named("en"), es: named("es"), de: named("de"), fr: named("fr") },
    { robots: { index: false } },
  );
}

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const [{ vertical, locale, actor }, loaded] = await Promise.all([getRuntime(), loadCustomer(id)]);
  if (loaded.status === "missing") notFound();

  const text = customerRecordMessages[locale];
  const words = customerDirectoryMessages[locale].card;
  const levels = [
    homeLevel(vertical.id, locale),
    { label: textFor(vertical.id, locale, "customers.title"), href: LIST },
  ];

  if (loaded.status === "failed") {
    return (
      <div className="flex flex-col gap-4 py-4" data-content-padding="false">
        <PageTrail className="px-4 md:px-6" current={text.meta.title} label={text.breadcrumb.label} levels={levels} />
        <div className="px-4 md:px-6">
          <RecordReadState state={loaded.state} reason={loaded.reason} />
        </div>
      </div>
    );
  }

  const { customer } = loaded;
  const contact = contactOf(customer, locale);
  const row = toRow(customer);
  const consent = consentOf(customer.consent);

  return (
    <LocaleBundles bundles={[customerDirectoryBundle, customerRecordBundle, contactFieldsBundle]}>
      <div className="flex flex-col gap-4 py-4" data-content-padding="false">
        <PageTrail className="px-4 md:px-6" current={customer.name} label={text.breadcrumb.label} levels={levels} />
        <RecordHeader
          customer={row}
          blockReason={customer.blockReason}
          attendance={attendanceOf(customer.figures)}
          text={text.header}
          locale={locale}
          actions={
            <RecordActions
              customerId={customer.id}
              customerName={customer.name}
              contact={{ name: customer.name, phone: customer.phone ?? "", email: customer.email ?? "" }}
              blocked={customer.blocked}
              blockReason={customer.blockReason}
              can={abilitiesOf(actor.permissions)}
              errors={customersErrors}
            >
              <RecordContactLinks customer={row} />
            </RecordActions>
          }
        />

        <Tabs className="min-h-0 flex-1 gap-0" defaultValue="overview">
          <div className="touch-pan-x scrollbar-none overflow-x-auto overscroll-x-contain border-y">
            <TabsList
              className="w-max min-w-full justify-start gap-4 px-4 *:data-[slot=tabs-trigger]:flex-none md:px-6"
              variant="line"
            >
              <TabsTrigger value="overview">{text.tabs.overview}</TabsTrigger>
              <TabsTrigger value="notes">{text.tabs.notes}</TabsTrigger>
              <TabsTrigger value="contact">{text.tabs.contact}</TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 md:px-6">
            <TabsContent value="overview">
              <div className="grid lg:grid-cols-[minmax(0,1fr)_auto_18rem]">
                <div className="py-4 lg:pr-6">
                  <RecordOverview
                    customer={row}
                    noShows={customer.figures.noShows}
                    language={contact.language}
                    consent={consent}
                    text={text}
                    words={words}
                    locale={locale}
                  />
                </div>
                <Separator className="hidden lg:block" orientation="vertical" />
                <div className="py-4 lg:pl-6">
                  <RecordStateColumn blocked={customer.blocked} vip={customer.vip} text={text.state} words={words} />
                </div>
              </div>
            </TabsContent>

            <TabsContent className="py-4" value="notes">
              <RecordNotes notes={customer.notes} text={text.notes} locale={locale} />
            </TabsContent>

            <TabsContent className="py-4" value="contact">
              <RecordContact contact={contact} text={text} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </LocaleBundles>
  );
}
