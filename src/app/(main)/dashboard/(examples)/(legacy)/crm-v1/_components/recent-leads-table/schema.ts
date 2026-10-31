import z from "zod";

export const leadStatuses = ["new", "contacted", "qualified", "proposalSent", "negotiation", "won"] as const;
export const leadSources = ["website", "social", "referral", "cold", "other"] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = (typeof leadSources)[number];

const recentLeadsSchema = z.object({
  id: z.string(),
  name: z.string(),
  company: z.string(),
  status: z.enum(leadStatuses),
  source: z.enum(leadSources),
  /** Minutes since the lead's last activity; the table writes it as relative time for the locale. */
  minutesAgo: z.number().int().nonnegative(),
});

export type RecentLeadRow = z.infer<typeof recentLeadsSchema>;
