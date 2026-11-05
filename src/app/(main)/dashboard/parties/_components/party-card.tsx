import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMessages } from "@/core/i18n/client";

import type { PartyRow } from "./directory-model";
import { partyDirectoryMessageKey } from "./messages";

/** The roles of a party as pills, in the language of the screen. */
export function RoleBadges({ roles }: { roles: PartyRow["roles"] }) {
  const text = useMessages(partyDirectoryMessageKey);
  return (
    <>
      {roles.map((role) => (
        <Badge key={role} variant="secondary">
          {text.roleName[role]}
        </Badge>
      ))}
    </>
  );
}

/**
 * One party. The name is the control that opens its record panel; its box stretches over the whole card, so the card
 * is the target and a long name wraps instead of widening the card.
 */
export function PartyCard({ party, onOpen }: { party: PartyRow; onOpen: (party: PartyRow, opener: Element) => void }) {
  const text = useMessages(partyDirectoryMessageKey);

  return (
    <Card className="hover:bg-foreground/5 relative gap-2 px-(--card-spacing) transition-colors">
      <h3 className="text-sm font-medium break-words">
        <button
          type="button"
          className="focus-visible:ring-ring/50 rounded-sm text-left outline-none after:absolute after:inset-0 after:rounded-[inherit] focus-visible:ring-3"
          onClick={(event) => onOpen(party, event.currentTarget)}
        >
          {party.legalName}
        </button>
      </h3>
      {party.tradeName !== undefined && <p className="text-muted-foreground text-xs break-words">{party.tradeName}</p>}
      <p className="text-muted-foreground text-xs break-all">
        {text.card.taxId} {party.taxId}
      </p>
      <p className="text-muted-foreground min-w-0 text-xs break-all">{party.email}</p>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <RoleBadges roles={party.roles} />
      </div>
    </Card>
  );
}
