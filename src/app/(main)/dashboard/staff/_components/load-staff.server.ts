import "server-only";

import { getRuntime } from "@/config/runtime";
import { termLabel, textFor } from "@/config/vocabulary.server";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";
import { staffRecordSchema } from "@/modules/staff";

import { type TeamCard, toCard } from "./team-model";

/** One page of the directory; small enough to render at once, and the cursor leads to the rest. */
export const PAGE_SIZE = 24;

const pageSchema = pageOutput(staffRecordSchema);

/** `staff.list` has no error codes of its own: the shared texts by class are enough for a failed list. */
const NO_OWN_ERRORS = { en: {}, es: {}, de: {}, fr: {} };

export interface LoadedStaff {
  readonly state: ReadStatus;
  /** The translated reason when the read failed or was refused. */
  readonly reason?: string;
  readonly cards: TeamCard[];
  readonly nextCursor: string | null;
}

/**
 * Reads one page of `staff.list` for the current actor (ADR 0005) and maps it to cards. The role ids become the
 * preset's role names here, on the server, so the browser receives words and never the role table.
 */
export async function loadStaff(cursor: string | undefined): Promise<LoadedStaff> {
  const { client, locale, vertical } = await getRuntime();
  const answer = await client.call(
    "staff.list",
    cursor === undefined ? { limit: PAGE_SIZE } : { limit: PAGE_SIZE, cursor },
  );
  const state = readStateOf(answer, (value) => pageSchema.parse(value).items.length === 0);

  if (!isAwaitingApproval(answer) && answer.ok) {
    const page = pageSchema.parse(answer.value);
    const roleName = (roleId: string) => {
      const role = vertical.roles.find((candidate) => candidate.id === roleId);
      return role === undefined ? roleId : textFor(vertical.id, locale, role.labelKey);
    };
    // A skill is data the business types; the preset words the ones its seed uses and the rest show as typed.
    const skillName = (skill: string) => termLabel(vertical.id, locale, "skills", skill);
    return {
      state,
      cards: page.items.map((member) => toCard(member, roleName, skillName)),
      nextCursor: page.nextCursor,
    };
  }
  const reason = !isAwaitingApproval(answer) && !answer.ok ? errorText(answer.error, NO_OWN_ERRORS, locale) : undefined;
  return { state, ...(reason === undefined ? {} : { reason }), cards: [], nextCursor: null };
}
