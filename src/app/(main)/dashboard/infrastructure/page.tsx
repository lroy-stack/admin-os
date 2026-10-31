import { pageMetadata } from "@/config/metadata.server";

import { infrastructureGroups } from "./_components/infrastructure-data";
import { InfrastructureHeader } from "./_components/infrastructure-header";
import { infrastructureMessages } from "./_components/messages.server";
import { ProjectEnvironments } from "./_components/project-environments";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export const generateMetadata = () => pageMetadata("/dashboard/infrastructure", infrastructureMessages);

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <InfrastructureHeader />

      <div className="flex flex-col gap-4">
        {infrastructureGroups.map((group) => (
          <ProjectEnvironments key={group.id} group={group} />
        ))}
      </div>
    </div>
  );
}
