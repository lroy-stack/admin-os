import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { textFor } from "@/config/vocabulary.server";
import { PageHeader } from "@/ds/components";
import { contactFieldsBundle, customersErrors } from "@/modules/customers/server";

import { CustomerDirectory } from "./_components/customer-directory";
import { loadCustomers } from "./_components/load-customers.server";
import { customerDirectoryBundle, customerDirectoryMessages } from "./_components/messages.server";

const ROUTE = "/dashboard/customers";

export const generateMetadata = () => pageMetadata(ROUTE, customerDirectoryMessages);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[]; q?: string | string[] }>;
}) {
  const { cursor, q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  const [{ vertical, locale }, loaded] = await Promise.all([
    getRuntime(),
    loadCustomers(typeof cursor === "string" && cursor !== "" ? cursor : undefined),
  ]);

  return (
    <LocaleBundles bundles={[customerDirectoryBundle, contactFieldsBundle]}>
      <div className="flex flex-col gap-6">
        {/* The title is the preset's word for its customers (guests, clients…). */}
        <PageHeader title={textFor(vertical.id, locale, "customers.title")} kpis={[]} />
        <CustomerDirectory
          key={initialQuery}
          initialQuery={initialQuery}
          errors={customersErrors}
          state={loaded.state}
          reason={loaded.reason}
          customers={loaded.rows}
          pager={{
            nextHref: loaded.nextCursor === null ? null : `${ROUTE}?cursor=${encodeURIComponent(loaded.nextCursor)}`,
            firstHref: cursor === undefined ? null : ROUTE,
          }}
        />
      </div>
    </LocaleBundles>
  );
}
