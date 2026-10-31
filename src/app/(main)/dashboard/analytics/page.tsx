import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";

import { GrowthReports } from "./_components/growth-reports";
import { growthBundle, growthMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/analytics", growthMessages);

export default function Page() {
  return (
    <LocaleBundles bundles={[growthBundle]}>
      <GrowthReports />
    </LocaleBundles>
  );
}
