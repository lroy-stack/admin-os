import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { textFor } from "@/config/vocabulary.server";
import { can } from "@/core/access";
import { PageHeader } from "@/ds/components";
import { partiesErrors } from "@/modules/parties/server";

import { loadParties } from "./_components/load-parties.server";
import { partyDirectoryBundle, partyDirectoryMessages } from "./_components/messages.server";
import { PartyDirectory } from "./_components/party-directory";

const ROUTE = "/dashboard/parties";

export const generateMetadata = () => pageMetadata(ROUTE, partyDirectoryMessages);

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[]; q?: string | string[] }>;
}) {
  const { cursor, q } = await searchParams;
  const initialQuery = typeof q === "string" ? q : "";
  const [{ vertical, locale, actor }, loaded] = await Promise.all([
    getRuntime(),
    loadParties(typeof cursor === "string" && cursor !== "" ? cursor : undefined),
  ]);

  return (
    <LocaleBundles bundles={[partyDirectoryBundle]}>
      <div className="flex flex-col gap-6">
        <PageHeader title={textFor(vertical.id, locale, "parties.title")} kpis={[]} />
        <PartyDirectory
          key={initialQuery}
          initialQuery={initialQuery}
          state={loaded.state}
          reason={loaded.reason}
          parties={loaded.rows}
          errors={partiesErrors}
          canManage={can(actor, "manage:parties")}
          pager={{
            nextHref: loaded.nextCursor === null ? null : `${ROUTE}?cursor=${encodeURIComponent(loaded.nextCursor)}`,
            firstHref: cursor === undefined ? null : ROUTE,
          }}
        />
      </div>
    </LocaleBundles>
  );
}
