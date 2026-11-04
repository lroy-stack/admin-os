import { type MessageKey, messageKey, type Plural } from "@/core/i18n/client";

import type { LedgerPriority, LedgerStage, RiskView } from "./analytics-data";

/** Text of /dashboard/analytics-v1: the risk dashboard's UI and its demo accounts' business wording. */
export interface AnalyticsV1Messages {
  /** Placeholders: `{value}`, a signed number (percentage points). */
  readonly percentagePoints: string;
  /** Placeholders: `{window}`, the number of days of the risk scale. */
  readonly riskLadder: string;
  readonly overview: {
    readonly viewLabel: string;
    readonly views: Readonly<Record<RiskView, { readonly label: string; readonly description: string }>>;
    readonly filters: string;
    readonly showing: string;
    readonly allDeals: string;
    readonly filterOptions: {
      readonly enterpriseOnly: { readonly label: string; readonly summary: string };
      /** `label` takes `{days}`, the idle threshold. */
      readonly stalledOnly: { readonly label: string; readonly summary: string };
      readonly overdueOnly: { readonly label: string; readonly summary: string };
      readonly includeRenewals: { readonly label: string; readonly summary: string };
    };
    readonly export: string;
    readonly day: string;
    readonly revenue: string;
    /** Placeholders: `{amount}`. */
    readonly previous: string;
    readonly selectedRange: string;
    readonly riskSummary: string;
    readonly riskSummaryDescription: string;
    readonly versusPrevious: string;
    readonly metrics: {
      readonly stalled: string;
      readonly revenueAtRisk: string;
      readonly winRateTrend: string;
      readonly cycleDrift: string;
    };
  };
  readonly forecast: {
    readonly title: string;
    /** Placeholders: `{weeks}`. */
    readonly description: string;
    /** Placeholders: `{week}`, the week number. */
    readonly weekShort: string;
    readonly attainment: string;
    readonly attainmentNote: string;
    readonly weightedPipeline: string;
    /** Placeholders: `{amount}`. */
    readonly weightedPipelineNote: string;
    readonly confidence: string;
    readonly confidenceNote: string;
    readonly closedWon: string;
    readonly target: string;
    readonly pipelineVsTarget: string;
  };
  readonly coverage: {
    readonly title: string;
    readonly description: string;
    readonly atRisk: string;
    /** Placeholders: `{current}`, `{target}`: coverage multiples. */
    readonly multiple: string;
    /** Placeholders: `{amount}`. */
    readonly gap: string;
    /** Placeholders: `{count}` (deals), `{days}`: a formatted duration. */
    readonly deals: Plural;
    readonly summary: string;
    readonly levers: {
      /** Placeholders: `{count}`. */
      readonly deal: Plural;
      /** Placeholders: `{amount}`. */
      readonly dealValue: string;
      /** Placeholders: `{points}`: the percentage-point change. */
      readonly conversion: string;
      /** Placeholders: `{amount}`. */
      readonly conversionValue: string;
      /** Placeholders: `{days}`: the signed duration. */
      readonly cycle: string;
      /** Placeholders: `{amount}`. */
      readonly cycleValue: string;
      /** Placeholders: `{share}`. */
      readonly context: string;
    };
    readonly owner: string;
    readonly focus: string;
    readonly focusValue: string;
    readonly due: string;
    readonly dueValue: string;
    /** Placeholders: `{count}`. */
    readonly openTopDeals: Plural;
    /** Placeholders: `{lever}`, `{share}`. */
    readonly fastestPath: string;
    readonly prioritySequence: string;
  };
  readonly queue: {
    readonly title: string;
    readonly description: string;
    readonly actionableDeals: string;
    readonly revenueInPlay: string;
    readonly ownersEngaged: string;
    readonly medianRisk: string;
    readonly interventionMix: string;
    /** Placeholders: `{priority}`, `{amount}`. */
    readonly mixBadge: string;
    /** Placeholders: `{count}`, `{share}`, `{amount}`. */
    readonly mixRow: Plural;
    readonly managerFocus: string;
    readonly thisCycle: string;
    readonly coachQueue: string;
    readonly primaryOwner: string;
    readonly stalePipeline: string;
    /** Placeholders: `{count}`, `{amount}`. */
    readonly dealsWithAmount: Plural;
    /** Placeholders: `{owner}`, `{count}`. */
    readonly ownerDeals: Plural;
    readonly nextInterventions: string;
    /** Placeholders: `{owner}`, `{risk}`. */
    readonly ownerRisk: string;
    readonly noActionMonitor: string;
    /** Placeholders: `{count}`. */
    readonly dealsCount: Plural;
  };
  readonly ledger: {
    readonly title: string;
    readonly description: string;
    /** Placeholders: `{count}`. */
    readonly accounts: Plural;
    readonly criticalAccounts: string;
    /** Placeholders: `{limit}`. */
    readonly criticalDetail: string;
    readonly escalationsDue: string;
    /** Placeholders: `{days}`. */
    readonly nextDays: string;
    readonly medianInactivity: string;
    readonly currentWindow: string;
    readonly overdueRevenue: string;
    readonly overdueDetail: string;
    readonly columns: {
      readonly account: string;
      readonly blocker: string;
      readonly owner: string;
      readonly idle: string;
      readonly closeVariance: string;
      readonly nextAction: string;
      readonly riskLadder: string;
    };
    /** Placeholders: `{days}`: a formatted duration. */
    readonly overdueBy: string;
    /** Placeholders: `{days}`: a formatted duration. */
    readonly overdueShort: string;
    /** Placeholders: `{dealId}`, `{stage}`. */
    readonly dealStage: string;
    readonly stages: Readonly<Record<LedgerStage, string>>;
    readonly priorities: Readonly<Record<LedgerPriority, string>>;
    /** The next action follows from the priority; `none` is the line for accounts that need no intervention. */
    readonly actions: Readonly<Record<LedgerPriority | "none", string>>;
  };
}

export const analyticsV1MessageKey: MessageKey<AnalyticsV1Messages> = messageKey<AnalyticsV1Messages>("analyticsV1");
