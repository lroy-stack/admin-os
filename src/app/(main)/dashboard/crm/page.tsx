import type { Metadata } from "next";

import { PageHeader } from "@/ds/components";
import { openDeals } from "@/lib/crm";

import { DealPipeline } from "./_components/deal-pipeline";
import { outcomes, pipelineKpis } from "./_components/pipeline-data";

export const metadata: Metadata = {
  title: "Deal Pipeline",
  description: "Open deals by stage with close dates, values and owners, plus deals won and lost this month.",
  alternates: {
    canonical: "/dashboard/crm",
  },
};

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Deal Pipeline" kpis={pipelineKpis} />
      <DealPipeline deals={openDeals} outcomes={outcomes} />
    </div>
  );
}
