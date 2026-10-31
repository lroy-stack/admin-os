import { CalendarDays, CircleCheck, Clock3 } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { format, type Locale } from "@/core/i18n/client";

import { profileMessages } from "./messages.server";
import type { ProfileRecord } from "./profile-data";

export function ProfileStatusSidebar({ profile, locale }: { profile: ProfileRecord; locale: Locale }) {
  const text = profileMessages[locale].status;

  return (
    <aside>
      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-sm font-medium">{text.recordStatus}</h2>
        <div className="flex items-start gap-2">
          <CircleCheck aria-hidden="true" className="text-muted-foreground mt-0.5 size-4" />
          <div>
            <p className="text-sm font-medium">{text.activeContractor}</p>
            <p className="text-muted-foreground text-xs">{text.accessActive}</p>
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {format(text.updated, locale, { date: profile.updatedAt, name: profile.updatedBy })}
        </p>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-sm font-medium">{text.upcomingEvents}</h2>
        <div className="flex flex-col">
          <div className="flex gap-3 py-2.5">
            <CalendarDays aria-hidden="true" className="text-muted-foreground mt-0.5 size-4" />
            <div>
              <p className="text-sm font-medium">{text.timeOff}</p>
              <p className="text-muted-foreground text-xs">{profile.nextLeave}</p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3 py-2.5">
            <Clock3 aria-hidden="true" className="text-muted-foreground mt-0.5 size-4" />
            <div>
              <p className="text-sm font-medium">{text.lastWorkingDay}</p>
              <p className="text-muted-foreground text-xs">{profile.lastWorkingDay}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
