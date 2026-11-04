import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";
import { getRuntime } from "@/config/runtime";
import { can } from "@/core/access";
import { PageHeader } from "@/ds/components";

import { loadBusinessDetails } from "../_components/load-business.server";
import { BusinessDetailsView } from "./_components/business-details";
import { BusinessReadState } from "./_components/business-read-state";
import { EditBusinessDetails } from "./_components/edit-business-dialog";
import { businessSettingsBundle, businessSettingsMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/settings", businessSettingsMessages);

/**
 * The business settings (spec 008, ADR 0006 "Settings sections"): every role reads the business details; the owner
 * edits them in a form dialog that writes `settings.values.update` into the demo session.
 */
export default async function Page() {
  const [{ actor, locale }, loaded] = await Promise.all([getRuntime(), loadBusinessDetails()]);
  const text = businessSettingsMessages[locale];
  const mayEdit = can(actor, "manage:settings");

  return (
    <LocaleBundles bundles={[businessSettingsBundle]}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={text.title}
          kpis={[]}
          actions={mayEdit && loaded.details ? <EditBusinessDetails details={loaded.details} /> : undefined}
        />
        <BusinessReadState state={loaded.state} {...(loaded.reason === undefined ? {} : { reason: loaded.reason })}>
          {loaded.details ? <BusinessDetailsView details={loaded.details} text={text} locale={locale} /> : null}
          {mayEdit ? null : <p className="text-muted-foreground text-sm">{text.ownerOnly}</p>}
        </BusinessReadState>
      </div>
    </LocaleBundles>
  );
}
