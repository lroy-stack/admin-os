import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

import type { StaffDirectoryMessages } from "./messages";
import type { TeamCard } from "./team-model";

/** One member: initials, name, role names and skills; a pill only when they are inactive. It links nowhere yet. */
export function StaffCard({ member, text }: { member: TeamCard; text: StaffDirectoryMessages }) {
  return (
    <Card className="gap-3 px-(--card-spacing)">
      <div className="flex items-start justify-between gap-2">
        <Avatar className="size-9 after:hidden">
          <AvatarFallback className="bg-foreground/10 text-[11px] font-medium">
            {getInitials(member.name)}
          </AvatarFallback>
        </Avatar>
        {!member.active && <Badge variant="secondary">{text.inactive}</Badge>}
      </div>

      <div className="flex min-w-0 flex-col gap-0.5">
        <h3 className="text-sm font-medium break-words">{member.name}</h3>
        {member.roles.length > 0 && <p className="text-muted-foreground text-xs">{member.roles.join(", ")}</p>}
      </div>

      {member.skills.length > 0 && (
        <ul aria-label={text.skills} className="flex flex-wrap items-center gap-1.5">
          {member.skills.map((skill) => (
            <li key={skill} className="bg-foreground/10 rounded-full px-2.5 py-1 text-[11px] break-words">
              {skill}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
