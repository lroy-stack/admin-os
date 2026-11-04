import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getMessages } from "@/config/locale.server";

import { profileMessages } from "./messages.server";
import type { ProfileRecord } from "./profile-data";

interface ProfileOverviewProps {
  profile: ProfileRecord;
}

export async function ProfileOverview({ profile }: ProfileOverviewProps) {
  const text = (await getMessages(profileMessages)).overview;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.about}</h2>
        <p className="text-muted-foreground text-sm">{profile.bio}</p>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.workDetails}</h2>
        <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.contractorId}</span>
              <span className="text-sm">{profile.contractorId}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.engagementStatus}</span>
              <span className="text-sm">{profile.engagementStatus}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.jobLevel}</span>
              <span className="text-sm">{profile.jobLevel}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.department}</span>
              <span className="text-sm">{profile.department}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.team}</span>
              <span className="text-sm">{profile.team}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.currentProject}</span>
              <span className="text-sm">{profile.currentProject}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.startDate}</span>
              <span className="text-sm">{profile.startDate}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{text.engagementLength}</span>
              <span className="text-sm">{profile.engagementLength}</span>
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-heading text-base leading-none font-medium">{text.reportingLine}</h2>
            <p className="text-muted-foreground text-sm">{text.directManager}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 py-3">
          <Avatar size="lg">
            <AvatarFallback>{profile.manager.initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{profile.manager.name}</p>
            <p className="text-muted-foreground text-xs">{profile.manager.role}</p>
          </div>
        </div>
      </div>
    </>
  );
}
