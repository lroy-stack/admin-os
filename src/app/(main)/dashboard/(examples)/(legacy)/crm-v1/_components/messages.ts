import { type MessageKey, messageKey, type Plural } from "@/core/i18n/client";

import type { ActionDue, ActionItemId, ActionPriority, PipelineStageId, ProjectId, RegionId } from "./crm.config";
import type { LeadSource, LeadStatus } from "./recent-leads-table/schema";

/** Text of /dashboard/crm-v1: the CRM dashboard's UI and its demo business wording. */
export interface CrmV1Messages {
  readonly statuses: Readonly<Record<LeadStatus, string>>;
  readonly sources: Readonly<Record<LeadSource, string>>;
  readonly overview: {
    readonly newLeads: string;
    readonly lastMonth: string;
    readonly newLeadsSeries: string;
    readonly disqualifiedSeries: string;
    /** Placeholders: `{month}`, `{range}`. */
    readonly tooltipRange: string;
    /** The card title and the chart series. */
    readonly proposals: string;
    readonly revenue: string;
    /** Placeholders: `{months}`. */
    readonly lastMonths: string;
    readonly projectsWon: string;
    readonly revenueGrowth: string;
    readonly yearToDate: string;
    /** Placeholders: `{growth}`, the formatted percentage. */
    readonly sinceLastYear: string;
  };
  readonly insights: {
    readonly leadsBySource: string;
    readonly leads: string;
    readonly downloadCsv: string;
    readonly projectRevenue: string;
    readonly actual: string;
    readonly remaining: string;
    /** Placeholders: `{progress}`, `{count}` (projects above target). */
    readonly projectSummary: Plural;
    readonly projects: Readonly<Record<ProjectId, string>>;
  };
  readonly operations: {
    readonly salesPipeline: string;
    readonly pipelineStages: Readonly<Record<PipelineStageId, string>>;
    /** Placeholders: `{change}`, the formatted percentage. */
    readonly pipelineIncrease: string;
    readonly salesByRegion: string;
    readonly regions: Readonly<Record<RegionId, string>>;
    /** Placeholders: `{count}`. */
    readonly regionsTracked: Plural;
    /** Placeholders: `{count}`. */
    readonly regionsGrowing: Plural;
    readonly actionItems: string;
    readonly actions: Readonly<Record<ActionItemId, { readonly title: string; readonly description: string }>>;
    readonly priorities: Readonly<Record<ActionPriority, string>>;
    readonly due: Readonly<Record<ActionDue, string>>;
  };
  readonly table: {
    readonly title: string;
    readonly description: string;
    readonly view: string;
    readonly toggleColumns: string;
    readonly export: string;
    readonly columns: {
      readonly ref: string;
      readonly name: string;
      readonly company: string;
      readonly status: string;
      readonly source: string;
      readonly lastActivity: string;
    };
    readonly selectAll: string;
    readonly selectRow: string;
    readonly openMenu: string;
    readonly menu: {
      readonly delete: string;
    };
    /** Placeholders: `{name}`. */
    readonly deleted: string;
    readonly empty: string;
    /** Placeholders: `{selected}`, `{count}` (rows in total). */
    readonly selected: Plural;
    readonly rowsPerPage: string;
    /** Placeholders: `{page}`, `{pages}`. */
    readonly pageOf: string;
    readonly firstPage: string;
    readonly previousPage: string;
    readonly nextPage: string;
    readonly lastPage: string;
  };
}

export const crmV1MessageKey: MessageKey<CrmV1Messages> = messageKey<CrmV1Messages>("crmV1");
