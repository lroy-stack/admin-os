/**
 * Demo figures of the CRM dashboard as numbers and ids. Labels, project and region names, action items and lead
 * statuses live in the route dictionary; people, companies and deal codes are proper nouns and stay as they are.
 */
import type { LeadSource, RecentLeadRow } from "./recent-leads-table/schema";

/** The month before the demo's "today" (2026-10-31), as an ISO year-month. */
export const LAST_MONTH = "2026-09";

/** Day ranges of the month, shown in tooltips as the demo data's buckets. */
export const leadsChartData = [
  { date: "1-5", newLeads: 120, disqualified: 40 },
  { date: "6-10", newLeads: 95, disqualified: 30 },
  { date: "11-15", newLeads: 60, disqualified: 22 },
  { date: "16-20", newLeads: 100, disqualified: 35 },
  { date: "21-25", newLeads: 150, disqualified: 70 },
  { date: "26-30", newLeads: 110, disqualified: 60 },
];

export const proposalsChartData = [
  { date: "1-5", proposalsSent: 9 },
  { date: "6-10", proposalsSent: 16 },
  { date: "11-15", proposalsSent: 6 },
  { date: "16-20", proposalsSent: 18 },
  { date: "21-25", proposalsSent: 11 },
  { date: "26-30", proposalsSent: 14 },
];

/** `month` is an ISO year-month. */
export const revenueChartData = [
  { month: "2024-07", revenue: 6700 },
  { month: "2024-08", revenue: 7100 },
  { month: "2024-09", revenue: 6850 },
  { month: "2024-10", revenue: 7500 },
  { month: "2024-11", revenue: 8000 },
  { month: "2024-12", revenue: 8300 },
  { month: "2025-01", revenue: 7900 },
  { month: "2025-02", revenue: 8400 },
  { month: "2025-03", revenue: 8950 },
  { month: "2025-04", revenue: 9700 },
  { month: "2025-05", revenue: 11200 },
  { month: "2025-06", revenue: 9500 },
];

export const overviewFigures = {
  newLeadsChange: 0.546,
  revenue: 56050,
  revenueChange: 0.222,
  projectsWon: 136,
  projectsWonChange: -0.025,
  yearGrowth: 0.35,
} as const;

export const leadsBySourceChartData = [
  { source: "website", leads: 170 },
  { source: "referral", leads: 105 },
  { source: "social", leads: 90 },
  { source: "cold", leads: 62 },
  { source: "other", leads: 48 },
] as const satisfies readonly { source: LeadSource; leads: number }[];

export const leadSourceColors: Record<LeadSource, string> = {
  website: "var(--chart-1)",
  referral: "var(--chart-2)",
  social: "var(--chart-3)",
  cold: "var(--chart-4)",
  other: "var(--chart-5)",
};

export type ProjectId = "mvp" | "consultation" | "framer" | "devops" | "llm" | "launch";

export const projectRevenueChartData = (
  [
    { project: "mvp", actual: 82000, target: 90000 },
    { project: "consultation", actual: 48000, target: 65000 },
    { project: "framer", actual: 34000, target: 45000 },
    { project: "devops", actual: 77000, target: 90000 },
    { project: "llm", actual: 68000, target: 80000 },
    { project: "launch", actual: 52000, target: 70000 },
  ] satisfies { project: ProjectId; actual: number; target: number }[]
).map((row) => ({
  ...row,
  remaining: Math.max(0, row.target - row.actual),
}));

export const projectRevenueSummary = { averageProgress: 0.78, aboveTarget: 2 } as const;

export type PipelineStageId = "leads" | "qualified" | "proposalSent" | "negotiation" | "won";

export const salesPipelineChartData = [
  { stage: "leads", value: 680, fill: "var(--chart-1)" },
  { stage: "qualified", value: 480, fill: "var(--chart-2)" },
  { stage: "proposalSent", value: 210, fill: "var(--chart-3)" },
  { stage: "negotiation", value: 120, fill: "var(--chart-4)" },
  { stage: "won", value: 45, fill: "var(--chart-5)" },
] as const satisfies readonly { stage: PipelineStageId; value: number; fill: string }[];

export const pipelineLeadsChange = 0.182;

export type RegionId = "northAmerica" | "europe" | "asiaPacific" | "latinAmerica" | "middleEastAfrica";

export const regionSalesData = [
  { region: "northAmerica", sales: 37800, share: 0.31, growth: -0.032 },
  { region: "europe", sales: 40100, share: 0.34, growth: 0.094 },
  { region: "asiaPacific", sales: 30950, share: 0.26, growth: 0.128 },
  { region: "latinAmerica", sales: 12200, share: 0.07, growth: -0.017 },
  { region: "middleEastAfrica", sales: 2450, share: 0.02, growth: 0.06 },
] as const satisfies readonly { region: RegionId; sales: number; share: number; growth: number }[];

export type ActionItemId = "kickoff" | "demo" | "caseStudy";
export type ActionPriority = "high" | "medium" | "low";
export type ActionDue = "today" | "tomorrow" | "thisWeek";

export const actionItems = [
  { id: "kickoff", priority: "high", due: "today", checked: false },
  { id: "demo", priority: "medium", due: "tomorrow", checked: true },
  { id: "caseStudy", priority: "low", due: "thisWeek", checked: false },
] as const satisfies readonly { id: ActionItemId; priority: ActionPriority; due: ActionDue; checked: boolean }[];

export const recentLeadsData: RecentLeadRow[] = [
  { id: "L-1012", name: "Guillermo Rauch", company: "Vercel", status: "qualified", source: "website", minutesAgo: 30 },
  { id: "L-1018", name: "Nizzy", company: "Mail0", status: "qualified", source: "website", minutesAgo: 35 },
  { id: "L-1005", name: "Sahaj", company: "Tweakcn", status: "negotiation", source: "website", minutesAgo: 60 },
  { id: "L-1001", name: "Shadcn", company: "Shadcn/ui", status: "qualified", source: "website", minutesAgo: 120 },
  { id: "L-1003", name: "Sam Altman", company: "OpenAI", status: "proposalSent", source: "social", minutesAgo: 240 },
  {
    id: "L-1008",
    name: "Michael Andreuzza",
    company: "Lexington Themes",
    status: "contacted",
    source: "social",
    minutesAgo: 300,
  },
  { id: "L-1016", name: "Skyleen", company: "Animate UI", status: "proposalSent", source: "referral", minutesAgo: 420 },
  { id: "L-1007", name: "Alex Morgan", company: "Weblabs Studio", status: "won", source: "website", minutesAgo: 360 },
  {
    id: "L-1011",
    name: "Sebastian Rindom",
    company: "Medusa",
    status: "proposalSent",
    source: "referral",
    minutesAgo: 600,
  },
  { id: "L-1014", name: "Fred K. Schott", company: "Astro", status: "contacted", source: "social", minutesAgo: 720 },
  { id: "L-1010", name: "Peer Richelsen", company: "Cal.com", status: "new", source: "other", minutesAgo: 480 },
  { id: "L-1002", name: "Ammar Khnz", company: "BE", status: "contacted", source: "referral", minutesAgo: 1440 },
  { id: "L-1015", name: "Toby", company: "Shadcn UI Kit", status: "negotiation", source: "other", minutesAgo: 2880 },
  { id: "L-1006", name: "David Haz", company: "React Bits", status: "qualified", source: "referral", minutesAgo: 2880 },
  { id: "L-1004", name: "Erşad", company: "Align UI", status: "new", source: "cold", minutesAgo: 4320 },
];
