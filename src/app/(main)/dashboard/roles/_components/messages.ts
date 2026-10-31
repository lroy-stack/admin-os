import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { AccessLevel, PermissionSetId, RoleGroup, RoleId } from "./roles-table/data";

/** Text of /dashboard/roles, including the demo roles and permission sets. */
export interface RolesMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  readonly actions: { readonly importJson: string; readonly createRole: string };
  readonly tabs: { readonly roles: string; readonly permissionSets: string; readonly accessReviews: string };
  readonly review: {
    readonly title: string;
    /** Placeholders: `{count}`, the roles with unreviewed changes. */
    readonly description: Plural;
    readonly action: string;
  };
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly filters: {
    /** Each filter label carries its own colon so French can use a no-break space. */
    readonly type: string;
    readonly owner: string;
    readonly status: string;
    readonly all: string;
    readonly system: string;
    readonly custom: string;
    readonly active: string;
    readonly needsReview: string;
  };
  /** Names of the row groups in the table. */
  readonly groups: Readonly<Record<RoleGroup, string>>;
  readonly columns: {
    readonly role: string;
    readonly accessLevel: string;
    readonly users: string;
    readonly permissionSets: string;
    readonly lastReview: string;
    readonly owner: string;
    readonly status: string;
  };
  readonly rowMenu: {
    /** Placeholders: `{role}`. */
    readonly label: string;
    readonly reviewChanges: string;
    readonly viewDetails: string;
    readonly editRole: string;
    readonly duplicateRole: string;
    readonly reviewPermissions: string;
    readonly manageMembers: string;
    readonly archiveRole: string;
  };
  /** Name of the built-in owner of system roles; people keep their own names. */
  readonly systemOwner: string;
  readonly accessLevels: Readonly<Record<AccessLevel, string>>;
  readonly permissionSets: Readonly<Record<PermissionSetId, string>>;
  /** Demo roles: names a business writes in its own language. */
  readonly roleNames: Readonly<Record<RoleId, string>>;
  readonly table: {
    readonly empty: string;
    /** Placeholders: `{start}`, `{end}`, `{total}`; `{count}` (the total) selects the form. */
    readonly showing: Plural;
    /** Placeholders: `{shown}`, `{total}`. */
    readonly groupCount: string;
    readonly rowsPerPage: string;
    readonly paginationLabel: string;
    readonly previousPage: string;
    readonly nextPage: string;
  };
  readonly comingSoon: { readonly permissionSets: string; readonly accessReviews: string };
}

export const rolesMessageKey: MessageKey<RolesMessages> = messageKey<RolesMessages>("roles");
