import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { textFor } from "@/config/vocabulary.server";
import { PageHeader } from "@/ds/components";

import { loadStaff } from "./_components/load-staff.server";
import { staffDirectoryBundle, staffDirectoryMessages } from "./_components/messages.server";
import { StaffDirectory } from "./_components/staff-directory";

const ROUTE = "/dashboard/staff";

export const generateMetadata = () => pageMetadata(ROUTE, staffDirectoryMessages);

export default async function Page({ searchParams }: { searchParams: Promise<{ cursor?: string | string[] }> }) {
  const { cursor } = await searchParams;
  const [{ vertical, locale }, loaded] = await Promise.all([
    getRuntime(),
    loadStaff(typeof cursor === "string" && cursor !== "" ? cursor : undefined),
  ]);

  return (
    <LocaleBundles bundles={[staffDirectoryBundle]}>
      <div className="flex flex-col gap-6">
        {/* The title is the preset's word for its staff (team, stylists, mechanics). */}
        <PageHeader title={textFor(vertical.id, locale, "staff.title")} kpis={[]} />
        <StaffDirectory
          state={loaded.state}
          reason={loaded.reason}
          cards={loaded.cards}
          pager={{
            nextHref: loaded.nextCursor === null ? null : `${ROUTE}?cursor=${encodeURIComponent(loaded.nextCursor)}`,
            firstHref: cursor === undefined ? null : ROUTE,
          }}
        />
      </div>
    </LocaleBundles>
  );
}
