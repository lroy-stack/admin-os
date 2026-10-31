import "server-only";

import { z } from "zod";

import type { Locale } from "@/core/i18n";

import records from "../data.json";
import { sectionHeaders } from "../section-headers.server";
import { type ProposalSectionsRow, proposalSectionRecordSchema } from "./schema";

const sectionRecords = z.array(proposalSectionRecordSchema).parse(records);

/** The demo sections with their headers in one locale; the server calls it before data reaches the client table. */
export function localizeSections(locale: Locale): ProposalSectionsRow[] {
  const headers = sectionHeaders[locale];
  return sectionRecords.map((record) => {
    const header = headers[record.id];
    if (header === undefined) {
      throw new Error(`No ${locale} header for proposal section ${record.id}`);
    }
    return { ...record, header };
  });
}
