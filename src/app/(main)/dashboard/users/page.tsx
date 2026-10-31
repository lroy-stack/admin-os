import type { Metadata } from "next";

import { PageHeader } from "@/ds/components";

import { CustomerDirectory } from "./_components/customer-directory";
import { customerKpis, customerRows } from "./_components/customers-data";

export const metadata: Metadata = {
  title: "Customer Directory",
  description: "Customers by segment with open pipeline, last contact and relationship score.",
  alternates: {
    canonical: "/dashboard/users",
  },
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Customer Directory" kpis={customerKpis} />
      <CustomerDirectory customers={customerRows} />
    </div>
  );
}
