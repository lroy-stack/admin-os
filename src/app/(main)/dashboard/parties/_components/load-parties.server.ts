import "server-only";

import { getRuntime } from "@/config/runtime";
import { errorText } from "@/core/i18n";
import { pageOutput } from "@/core/pagination";
import { isAwaitingApproval, type ReadStatus, readStateOf } from "@/core/result";
import { partySchema } from "@/modules/parties";
import { partiesErrors } from "@/modules/parties/server";

import { PAGE_SIZE, type PartyRow, toRow } from "./directory-model";

const pageSchema = pageOutput(partySchema);

export interface LoadedParties {
  readonly state: ReadStatus;
  /** The translated reason when the read failed or was refused. */
  readonly reason?: string;
  readonly rows: PartyRow[];
  readonly nextCursor: string | null;
}

/** Reads one page of `parties.list` for the current actor (ADR 0005) and maps it to what the screen shows. */
export async function loadParties(cursor: string | undefined): Promise<LoadedParties> {
  const { client, locale } = await getRuntime();
  const answer = await client.call(
    "parties.list",
    cursor === undefined ? { limit: PAGE_SIZE } : { limit: PAGE_SIZE, cursor },
  );
  const state = readStateOf(answer, (value) => pageSchema.parse(value).items.length === 0);

  if (!isAwaitingApproval(answer) && answer.ok) {
    const page = pageSchema.parse(answer.value);
    return { state, rows: page.items.map(toRow), nextCursor: page.nextCursor };
  }
  const reason = !isAwaitingApproval(answer) && !answer.ok ? errorText(answer.error, partiesErrors, locale) : undefined;
  return { state, ...(reason === undefined ? {} : { reason }), rows: [], nextCursor: null };
}
