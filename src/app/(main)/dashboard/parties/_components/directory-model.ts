import { foldText } from "@/core/text";
import { type Party, type PartyRole, partyRoles } from "@/modules/parties";

/** What the directory needs of a party: the list's DTO without extensions. */
export type PartyRow = Omit<Party, "ext">;

export type RoleFilter = "all" | PartyRole;

export const ROLE_FILTERS: readonly RoleFilter[] = ["all", ...partyRoles];

/** One page of the directory; small enough to render at once, and the cursor leads to the rest. */
export const PAGE_SIZE = 24;

export function toRow({ ext: _ext, ...row }: Party): PartyRow {
  return row;
}

/** The legal name, the trade name and the tax ID: the fields `parties.list` matches a text against. */
function matchesQuery(row: PartyRow, query: string): boolean {
  const needle = foldText(query.trim());
  if (needle === "") return true;
  return [row.legalName, row.tradeName ?? "", row.taxId].some((field) => foldText(field).includes(needle));
}

/** The rows that pass the role filter and the search, in the order they came. Does not change its input. */
export function visibleRows(rows: readonly PartyRow[], options: { query: string; role: RoleFilter }): PartyRow[] {
  const { query, role } = options;
  return rows.filter((row) => (role === "all" || row.roles.includes(role)) && matchesQuery(row, query));
}
