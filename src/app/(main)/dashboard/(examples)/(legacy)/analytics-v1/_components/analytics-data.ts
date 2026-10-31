/**
 * Demo figures of the risk dashboard as numbers and ids. The wording (stage names, priorities, next actions, labels)
 * lives in the route dictionary; accounts, deal ids and owners are proper nouns and stay as they are.
 */

export type RiskView = "riskView" | "momentum" | "quality";
export type FilterToggleKey = "enterpriseOnly" | "stalledOnly" | "overdueOnly" | "includeRenewals";
export type LedgerStage = "legal" | "qualification" | "proposal" | "negotiation";
export type LedgerPriority = "escalate" | "coach" | "reforecast";

export const riskViews: readonly RiskView[] = ["riskView", "momentum", "quality"];
export const filterToggleKeys: readonly FilterToggleKey[] = [
  "enterpriseOnly",
  "stalledOnly",
  "overdueOnly",
  "includeRenewals",
];

/** The risk scale's window, in days. */
export const RISK_LADDER_WINDOW = 30;

export const overviewFigures = {
  revenue: 1_248_000,
  revenueChange: 0.094,
  revenueDelta: 107_000,
  previousRevenue: 1_141_000,
  stalledDeals: 8,
  revenueAtRisk: 1_151_000,
  /** Percentage points, signed. */
  winRateTrendPoints: 8.3,
  /** Days, signed. */
  cycleDriftDays: 2.3,
} as const;

export type ForecastPoint = {
  /** Week number, 1 to 12. */
  week: number;
  closedWon: number;
  weightedPipeline: number;
  target: number;
  /** Percentage points above target, shown over the last bar. */
  deltaPoints?: number;
};

export const forecastWeeks: ForecastPoint[] = [
  { week: 1, closedWon: 68.6, weightedPipeline: 152.4, target: 100 },
  { week: 2, closedWon: 87.1, weightedPipeline: 158.1, target: 100 },
  { week: 3, closedWon: 77.1, weightedPipeline: 154.8, target: 100 },
  { week: 4, closedWon: 94.3, weightedPipeline: 162.2, target: 100 },
  { week: 5, closedWon: 80.6, weightedPipeline: 160.4, target: 100 },
  { week: 6, closedWon: 100, weightedPipeline: 168.5, target: 100 },
  { week: 7, closedWon: 87.5, weightedPipeline: 172.1, target: 100 },
  { week: 8, closedWon: 95.8, weightedPipeline: 178.3, target: 100 },
  { week: 9, closedWon: 100, weightedPipeline: 181.0, target: 100 },
  { week: 10, closedWon: 95.9, weightedPipeline: 185.4, target: 100 },
  { week: 11, closedWon: 104.1, weightedPipeline: 188.7, target: 100 },
  { week: 12, closedWon: 109.5, weightedPipeline: 192.1, target: 100, deltaPoints: 9.5 },
];

export const forecastFigures = {
  attainment: 0.724,
  weightedPipeline: 1_284_000,
  remaining: 668_000,
  confidence: 0.81,
} as const;

export const coverageFigures = {
  currentMultiple: 1.9,
  targetMultiple: 3.0,
  gap: 222_930,
  openDeals: 4,
  etaDays: 10,
  topDeals: 5,
  owner: "Leila Zhang",
  levers: {
    enterpriseDeals: { count: 1, weighted: 72_133, share: 0.32 },
    conversion: { points: 5, perMonth: 49_182, share: 0.22 },
    cycle: { days: -4, perDay: 90_167, share: 0.4 },
  },
} as const;

export const queueFigures = {
  actionableDeals: 7,
  revenueInPlay: 811_000,
  ownersEngaged: 3,
  medianRisk: 72,
  mix: [
    { priority: "escalate", deals: 1, share: 0.14, amount: 174_000 },
    { priority: "coach", deals: 4, share: 0.57, amount: 478_000 },
    { priority: "reforecast", deals: 2, share: 0.29, amount: 159_000 },
  ],
  primaryOwner: { name: "Leila Zhang", deals: 3 },
  staleDeals: 8,
  staleAmount: 1_151_000,
  noActionDeals: 3,
  nextInterventions: [
    { dealId: "OPP-489", priority: "escalate", owner: "Leila Zhang", risk: 81 },
    { dealId: "OPP-475", priority: "coach", owner: "Omar Ali", risk: 76 },
    { dealId: "OPP-447", priority: "coach", owner: "Sofia Bautista", risk: 75 },
  ],
} as const;

export type LedgerRow = {
  id: number;
  account: string;
  dealId: string;
  stage: LedgerStage;
  owner: string;
  idleDays: number;
  overdueDays: number;
  priority: LedgerPriority | null;
  riskScore: number;
};

export const ledgerRows: LedgerRow[] = [
  {
    id: 1,
    account: "Oscorp Labs",
    dealId: "OPP-489",
    stage: "legal",
    owner: "Leila Zhang",
    idleDays: 36,
    overdueDays: 35,
    priority: "escalate",
    riskScore: 81,
  },
  {
    id: 2,
    account: "Hooli AI",
    dealId: "OPP-475",
    stage: "qualification",
    owner: "Omar Ali",
    idleDays: 33,
    overdueDays: 28,
    priority: "coach",
    riskScore: 76,
  },
  {
    id: 3,
    account: "Globex Systems",
    dealId: "OPP-447",
    stage: "qualification",
    owner: "Sofia Bautista",
    idleDays: 34,
    overdueDays: 37,
    priority: "coach",
    riskScore: 75,
  },
  {
    id: 4,
    account: "Umbrella Corp",
    dealId: "OPP-459",
    stage: "legal",
    owner: "Leila Zhang",
    idleDays: 29,
    overdueDays: 24,
    priority: "coach",
    riskScore: 72,
  },
  {
    id: 5,
    account: "Acme Industries",
    dealId: "OPP-421",
    stage: "negotiation",
    owner: "Leila Zhang",
    idleDays: 31,
    overdueDays: 32,
    priority: "coach",
    riskScore: 69,
  },
  {
    id: 6,
    account: "Wayne Devices",
    dealId: "OPP-471",
    stage: "proposal",
    owner: "Sofia Bautista",
    idleDays: 32,
    overdueDays: 22,
    priority: "reforecast",
    riskScore: 56,
  },
  {
    id: 7,
    account: "Aperture Health",
    dealId: "OPP-497",
    stage: "proposal",
    owner: "Omar Ali",
    idleDays: 30,
    overdueDays: 20,
    priority: "reforecast",
    riskScore: 50,
  },
  {
    id: 8,
    account: "Northwind Labs",
    dealId: "OPP-438",
    stage: "proposal",
    owner: "Julian Singh",
    idleDays: 23,
    overdueDays: 14,
    priority: null,
    riskScore: 42,
  },
  {
    id: 9,
    account: "Stark Logistics",
    dealId: "OPP-463",
    stage: "negotiation",
    owner: "Julian Singh",
    idleDays: 21,
    overdueDays: 10,
    priority: null,
    riskScore: 39,
  },
  {
    id: 10,
    account: "Soylent Foods",
    dealId: "OPP-482",
    stage: "negotiation",
    owner: "Julian Singh",
    idleDays: 24,
    overdueDays: 5,
    priority: null,
    riskScore: 31,
  },
];

export const ledgerFigures = {
  criticalAccounts: 1,
  criticalLimit: 80,
  escalationsDue: 1,
  medianInactivityDays: 31,
  overdueRevenue: 1_084_000,
} as const;
