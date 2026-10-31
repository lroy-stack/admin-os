import { BadgeCheck, Ellipsis, Eye, Mail, Pencil, UserRoundX } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatPercent, type Locale } from "@/core/i18n/client";

import { profileMessages } from "./messages.server";
import type { ProfileRecord } from "./profile-data";

const SEPARATOR = " · ";

interface ProfileHeaderProps {
  profile: ProfileRecord;
  locale: Locale;
}

export function ProfileHeader({ profile, locale }: ProfileHeaderProps) {
  const text = profileMessages[locale].header;
  const percent = formatPercent(profile.completeness, locale);

  return (
    <div className="flex flex-col gap-5 px-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid size-18 shrink-0 place-items-center sm:size-23">
          <span className="sr-only">{format(text.completeSr, locale, { percent })}</span>
          <svg aria-hidden="true" className="col-start-1 row-start-1 size-full -rotate-90" viewBox="0 0 100 100">
            <circle
              className="fill-none stroke-green-500 dark:stroke-green-600"
              cx="50"
              cy="50"
              pathLength="100"
              r="46"
              strokeDasharray={`${profile.completeness * 100} 100`}
              strokeLinecap="round"
              strokeWidth="2.5"
            />
          </svg>
          <Avatar className="col-start-1 row-start-1 size-16 after:border-0 sm:size-20">
            <AvatarImage alt={profile.name} src={profile.avatar} />
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading truncate text-xl leading-6 font-semibold tracking-tight sm:text-2xl sm:leading-7">
              {profile.name}
            </h1>
            <p className="text-muted-foreground line-clamp-2 text-sm leading-5 break-words">
              {[profile.workEmail, profile.jobTitle].join(SEPARATOR)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className="rounded-sm border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              variant="secondary"
            >
              {format(text.complete, locale, { percent })}
            </Badge>
            <Badge className="rounded-sm bg-green-600 text-white" variant="default">
              <BadgeCheck data-icon="inline-start" />
              {text.verified}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.employmentType}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.workplace}
            </Badge>
            <Badge className="rounded-sm" variant="outline">
              {profile.timeZone}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" asChild variant="outline">
          <a href={`mailto:${profile.workEmail}`}>
            <Mail data-icon="inline-start" />
            {text.email}
          </a>
        </Button>
        <Button size="sm">
          <Pencil data-icon="inline-start" />
          {text.edit}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-label={text.moreActions} size="icon-sm" variant="outline">
              <Ellipsis />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Eye />
                {text.viewAsEmployee}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <UserRoundX />
                {text.deactivate}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
