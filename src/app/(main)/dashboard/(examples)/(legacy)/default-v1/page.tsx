import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { ChartAreaInteractive } from "./_components/chart-area-interactive";
import { defaultV1Bundle, defaultV1Messages } from "./_components/messages.server";
import { localizeSections } from "./_components/proposal-sections-table/sections.server";
import { ProposalSectionsTable } from "./_components/proposal-sections-table/table";
import { SectionCards } from "./_components/section-cards";

// `robots: noindex` comes from the legacy layout.
export const generateMetadata = () => pageMetadata("/dashboard/default-v1", defaultV1Messages);

export default async function Page() {
  const locale = await getLocale();

  return (
    <LocaleBundles bundles={[defaultV1Bundle]}>
      <div className="@container/main flex flex-col gap-4 md:gap-6">
        <SectionCards />
        <ChartAreaInteractive />
        <ProposalSectionsTable data={localizeSections(locale)} />
      </div>
    </LocaleBundles>
  );
}
