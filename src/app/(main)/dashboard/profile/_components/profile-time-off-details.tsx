import { Separator } from "@/components/ui/separator";
import { getMessages } from "@/config/locale.server";

import { profileMessages } from "./messages.server";
import type { ProfileRecord } from "./profile-data";

export async function TimeOffDetails({ profile }: { profile: ProfileRecord }) {
  const text = (await getMessages(profileMessages)).timeOff;

  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.leaveBalance}</h2>
        <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.policy}</dt>
              <dd className="text-sm break-words">{profile.leavePolicy}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.carriedOver}</dt>
              <dd className="text-sm break-words">{profile.carriedOverLeave}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.annualAllowance}</dt>
              <dd className="text-sm break-words">{profile.annualLeaveAllowance}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.usedThisYear}</dt>
              <dd className="text-sm break-words">{profile.usedLeave}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.remaining}</dt>
              <dd className="text-sm break-words">{profile.remainingLeave}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.scheduled}</dt>
              <dd className="text-sm break-words">{profile.scheduledLeave}</dd>
            </div>
          </div>
        </dl>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-base font-medium">{text.upcomingAndApprovals}</h2>
        <dl className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.nextLeave}</dt>
              <dd className="text-sm break-words">{profile.nextLeave}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.pendingRequests}</dt>
              <dd className="text-sm break-words">{profile.pendingLeaveRequests}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.leaveYear}</dt>
              <dd className="text-sm break-words">{profile.leaveYear}</dd>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-xs">{text.approver}</dt>
              <dd className="text-sm break-words">{profile.manager.name}</dd>
            </div>
          </div>
        </dl>
      </div>
    </>
  );
}
