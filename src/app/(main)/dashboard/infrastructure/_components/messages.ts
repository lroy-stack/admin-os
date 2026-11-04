import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { EnvironmentKind, HealthStatus, ProjectId } from "./infrastructure-data";

/** Text of /dashboard/infrastructure, a screen of server components only, so it has no client message key. Organizations, domains, platforms, clouds and places are proper nouns. */
export interface InfrastructureMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  /** Placeholders: `{time}`, the elapsed time. The colon is part of the sentence. */
  readonly lastUpdated: string;
  readonly refresh: string;
  readonly summary: {
    readonly projects: Plural;
    readonly environments: Plural;
    readonly servers: Plural;
    /** Placeholders: `{value}`, the percentage. */
    readonly globalUptime: string;
  };
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly filters: {
    readonly organization: string;
    readonly stack: string;
    readonly cloudProvider: string;
    readonly environment: string;
    /** The facet window's heading. Placeholders: `{facet}`. */
    readonly title: string;
    readonly clear: string;
    /** A facet chip with its selection. Placeholders: `{facet}`, `{count}`. */
    readonly withCount: string;
  };
  /** Demo project names. */
  readonly projects: Readonly<Record<ProjectId, string>>;
  readonly project: {
    readonly addEnvironment: string;
    /** Placeholders: `{project}`. */
    readonly actions: string;
    readonly syncStatus: string;
    readonly copyProjectId: string;
    /** What a copy confirms, after "Copied". */
    readonly idLabel: string;
    /** Placeholders: `{project}`, `{time}`. */
    readonly synced: string;
    readonly noEnvironments: string;
  };
  readonly table: {
    readonly domain: string;
    readonly platform: string;
    readonly environment: string;
    readonly health: string;
    readonly latency: string;
    readonly uptime: string;
    readonly resources: string;
    readonly server: string;
    /** Placeholders: `{domain}`. */
    readonly rowActions: string;
    readonly restart: string;
    readonly urlLabel: string;
    readonly copyUrl: string;
    readonly customServer: string;
  };
  readonly environments: Readonly<Record<EnvironmentKind, string>>;
  readonly health: Readonly<Record<HealthStatus, string>>;
  readonly resources: { readonly cpu: string; readonly ram: string; readonly disk: string };
  readonly noResults: string;
  readonly restart: {
    /** Placeholders: `{domain}`. */
    readonly title: string;
    readonly verb: string;
    readonly consequence: string;
    /** Placeholders: `{domain}`. */
    readonly done: string;
  };
  /** The Add environment window; its title and verb are `project.addEnvironment`. */
  readonly form: {
    /** Placeholders: `{project}`. */
    readonly description: string;
    readonly domain: string;
    readonly platform: string;
    readonly country: string;
    readonly region: string;
    readonly required: string;
    /** Placeholders: `{domain}`, `{project}`. */
    readonly added: string;
  };
}

export const infrastructureMessageKey: MessageKey<InfrastructureMessages> =
  messageKey<InfrastructureMessages>("infrastructure");
