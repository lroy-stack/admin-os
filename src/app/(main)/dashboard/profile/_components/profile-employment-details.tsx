import { Separator } from "@/components/ui/separator";
import { getMessages } from "@/config/locale.server";

import { profileMessages } from "./messages.server";
import type { ProfileRecord } from "./profile-data";

export async function EmploymentDetails({ profile }: { profile: ProfileRecord }) {
  const text = (await getMessages(profileMessages)).employment;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.roleAndOrganization}</h2>
        <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.jobTitle}</dt>
              <dd className="text-sm break-words">{profile.jobTitle}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.team}</dt>
              <dd className="text-sm break-words">{profile.team}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.jobLevel}</dt>
              <dd className="text-sm break-words">{profile.jobLevel}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.manager}</dt>
              <dd className="text-sm break-words">{profile.manager.name}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.department}</dt>
              <dd className="text-sm break-words">{profile.department}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.currentProject}</dt>
              <dd className="text-sm break-words">{profile.currentProject}</dd>
            </div>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.contractDetails}</h2>
        <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.contractorId}</dt>
              <dd className="text-sm break-words">{profile.contractorId}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.engagementStatus}</dt>
              <dd className="text-sm break-words">{profile.engagementStatus}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.employmentType}</dt>
              <dd className="text-sm break-words">{profile.employmentType}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.contractingEntity}</dt>
              <dd className="text-sm break-words">{profile.contractingEntity}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.startDate}</dt>
              <dd className="text-sm break-words">{profile.startDate}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.lastWorkingDay}</dt>
              <dd className="text-sm break-words">{profile.lastWorkingDay}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.noticePeriod}</dt>
              <dd className="text-sm break-words">{profile.noticePeriod}</dd>
            </div>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.workArrangement}</h2>
        <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.workplace}</dt>
              <dd className="text-sm break-words">{profile.workplace}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.timeZone}</dt>
              <dd className="text-sm break-words">{profile.timeZone}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.weeklyHours}</dt>
              <dd className="text-sm break-words">{profile.weeklyHours}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.schedule}</dt>
              <dd className="text-sm break-words">{profile.schedule}</dd>
            </div>
          </div>
        </dl>
      </div>
    </>
  );
}
