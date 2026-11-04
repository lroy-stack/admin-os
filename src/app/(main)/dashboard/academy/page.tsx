import { LocaleBundles } from "@/app/_components/locale-root";
import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { AssignmentStatus } from "./_components/assignment-status";
import { ClassSchedule } from "./_components/class-schedule";
import { KpiCards } from "./_components/kpi-cards";
import { academyBundle, academyMessages } from "./_components/messages.server";
import { PerformanceHighlights } from "./_components/performance-highlights";
import { UpcomingEvents } from "./_components/upcoming-events";

export const generateMetadata = () => pageMetadata("/dashboard/academy", academyMessages);

export default async function Page() {
  const text = await getMessages(academyMessages);

  return (
    <LocaleBundles bundles={[academyBundle]}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-3xl tracking-tight break-words hyphens-auto">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.greeting}</p>
          </div>
        </div>

        <KpiCards />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-5">
            <ClassSchedule />
          </div>
          <div className="min-w-0 xl:col-span-7">
            <AssignmentStatus />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="min-w-0 xl:col-span-8">
            <PerformanceHighlights />
          </div>
          <div className="min-w-0 xl:col-span-4">
            <UpcomingEvents />
          </div>
        </div>
      </div>
    </LocaleBundles>
  );
}
