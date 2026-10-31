import { z } from "zod";

export const sectionTypes = [
  "cover-page",
  "table-of-contents",
  "narrative",
  "technical-content",
  "legal",
  "planning",
  "research",
  "financial",
  "plain-language",
  "visual",
] as const;

export const sectionStatuses = ["done", "in-process", "not-started"] as const;

export type SectionType = (typeof sectionTypes)[number];
export type SectionStatus = (typeof sectionStatuses)[number];

/** A stored section: names and enums are language-independent keys, the `header` is added per locale. */
export const proposalSectionRecordSchema = z.object({
  id: z.number(),
  type: z.enum(sectionTypes),
  status: z.enum(sectionStatuses),
  target: z.string(),
  limit: z.string(),
  /** A person's name (a proper noun), or null while nobody is assigned. */
  reviewer: z.string().nullable(),
});

export type ProposalSectionRecord = z.infer<typeof proposalSectionRecordSchema>;

/** A section as the table shows it, with its header in the request's locale. */
export type ProposalSectionsRow = ProposalSectionRecord & { readonly header: string };
