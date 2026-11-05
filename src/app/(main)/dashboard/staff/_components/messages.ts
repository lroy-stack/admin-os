import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

/**
 * Text of /dashboard/staff (the team directory). The page title, the nav label and the role names come from the preset
 * vocabulary (`staff.title`, `access.roles.*`), so the strings here never name a trade.
 */
export interface StaffDirectoryMessages {
  readonly meta: PageMeta;
  readonly search: { readonly label: string; readonly placeholder: string };
  /** The pill of a member who no longer works shifts; active members carry none. */
  readonly inactive: string;
  /** Names the skills of a card for screen readers. */
  readonly skills: string;
  readonly empty: {
    readonly noMembersTitle: string;
    readonly noMembers: string;
    readonly noMatchTitle: string;
    /** Placeholders: `{query}`. */
    readonly noMatch: string;
  };
  readonly pager: { readonly label: string; readonly next: string; readonly first: string };
}

export const staffDirectoryMessageKey: MessageKey<StaffDirectoryMessages> =
  messageKey<StaffDirectoryMessages>("staffDirectory");
