import { LocaleBundles } from "@/app/_components/locale-root";
import { pageMetadata } from "@/config/metadata.server";

import { InfrastructureBoard } from "./_components/infrastructure-board";
import { InfrastructureHeader } from "./_components/infrastructure-header";
import { InfrastructureProvider } from "./_components/infrastructure-state";
import { infrastructureBundle, infrastructureMessages } from "./_components/messages.server";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export const generateMetadata = () => pageMetadata("/dashboard/infrastructure", infrastructureMessages);

export default function Page() {
  return (
    <LocaleBundles bundles={[infrastructureBundle]}>
      <InfrastructureProvider>
        <div className="flex flex-col gap-4">
          <InfrastructureHeader />
          <InfrastructureBoard />
        </div>
      </InfrastructureProvider>
    </LocaleBundles>
  );
}
