import {
  CRM_AS_OF,
  type Customer,
  customers,
  type Deal,
  deals,
  type MonthlyWon,
  type OpenStage,
  stageProbability,
  type TeamMemberId,
  team,
} from "@/data/crm";

export type OpenDeal = Deal & { stage: OpenStage };

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const asOf = new Date(`${CRM_AS_OF}T18:00:00Z`);

export const openStages = [
  "qualification",
  "proposal",
  "negotiation",
  "closing",
] as const satisfies readonly OpenStage[];

export const stageLabels: Record<OpenStage, string> = {
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closing: "Closing",
};

const customerById = new Map(customers.map((customer) => [customer.id, customer]));
const memberById = new Map(team.map((member) => [member.id, member]));

export function getCustomer(id: string): Customer {
  const customer = customerById.get(id);
  if (!customer) throw new Error(`Unknown customer "${id}" in CRM mock data`);
  return customer;
}

export function getMember(id: TeamMemberId) {
  const member = memberById.get(id);
  if (!member) throw new Error(`Unknown team member "${id}" in CRM mock data`);
  return member;
}

export function isOpenDeal(deal: Deal): deal is OpenDeal {
  return deal.stage !== "won" && deal.stage !== "lost";
}

export const openDeals = deals.filter(isOpenDeal);

export function sumValue(list: readonly Deal[]) {
  return list.reduce((total, deal) => total + deal.value, 0);
}

export function weightedValue(deal: OpenDeal) {
  return deal.value * stageProbability[deal.stage];
}

export function monthTotal(month: MonthlyWon) {
  return month.enterprise + month.midMarket + month.smb;
}

/** True when the ISO date falls in the same calendar month as the mock "today". */
export function isInCurrentMonth(isoDate: string) {
  return isoDate.slice(0, 7) === CRM_AS_OF.slice(0, 7);
}

const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const shortMonth = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

/** "2026-12-06" → "Dec 6" */
export function formatShortDate(isoDate: string) {
  return shortDate.format(new Date(`${isoDate}T00:00:00Z`));
}

/** "2026-05" → "May" */
export function formatMonth(yearMonth: string) {
  return shortMonth.format(new Date(`${yearMonth}-01T00:00:00Z`));
}

/** Elapsed time from an ISO timestamp to the mock "today": "11 h ago", "2 d ago". */
export function formatTimeAgo(isoDateTime: string) {
  const elapsed = asOf.getTime() - new Date(isoDateTime).getTime();
  if (elapsed < DAY_MS) return `${Math.max(1, Math.round(elapsed / HOUR_MS))} h ago`;
  return `${Math.round(elapsed / DAY_MS)} d ago`;
}

export function daysSince(isoDateTime: string) {
  return (asOf.getTime() - new Date(isoDateTime).getTime()) / DAY_MS;
}

/** Open deals expected to close between the mock "today" and `days` ahead, soonest first. */
export function dealsClosingWithin(days: number) {
  return openDeals
    .filter((deal) => {
      const daysAhead = -daysSince(`${deal.closeDate}T00:00:00Z`);
      return daysAhead >= 0 && daysAhead <= days;
    })
    .sort((a, b) => a.closeDate.localeCompare(b.closeDate));
}
