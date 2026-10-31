import { cn } from "cn";

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import type { TeamMemberId } from "@/data/crm";
import { getMember } from "@/lib/crm";

const memberTones: Record<TeamMemberId, string> = {
  iv: "bg-foreground/90",
  km: "bg-brand",
  lb: "bg-salmon",
  as: "bg-azure",
  th: "bg-brand/70",
};

export function MemberAvatar({ id, className }: { id: TeamMemberId; className?: string }) {
  const member = getMember(id);
  return (
    <Avatar size="sm" className={cn("after:hidden", className)}>
      <AvatarFallback title={member.name} className={cn("text-background text-[9px] font-medium", memberTones[id])}>
        {member.initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** Overlapping owner avatars; the ring color follows the surface behind them via `ringClassName`. */
export function MemberAvatars({ ids, ringClassName }: { ids: readonly TeamMemberId[]; ringClassName?: string }) {
  return (
    <AvatarGroup role="group" className="-space-x-1.5" aria-label={ids.map((id) => getMember(id).name).join(", ")}>
      {ids.map((id) => (
        <MemberAvatar key={id} id={id} className={cn("ring-foreground/20 ring-2", ringClassName)} />
      ))}
    </AvatarGroup>
  );
}
