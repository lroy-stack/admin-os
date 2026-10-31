import type { SimpleIcon } from "simple-icons";
import { siNextdotjs, siNodedotjs, siReact, siRemix } from "simple-icons";

export type EnvironmentKind = "expired" | "production" | "staging";

export type HealthStatus = "online" | "unhealthy";

export type ProjectId = "console" | "analytics" | "kanban" | "inbox";

export interface InfrastructureEnvironment {
  domain: string;
  platform: {
    name: string;
    icon: SimpleIcon;
  };
  environment: EnvironmentKind;
  status: HealthStatus;
  latencyMs: number;
  uptime: { days: number; hours: number };
  /** The cloud brand, or null for a bare-metal or custom server, which has no brand to keep. */
  server: string | null;
  countryCode: string;
  /** Plan or region and city: product and place names, not translated. */
  plan: string;
  resources: {
    cpu: number;
    ram: number;
    disk: number;
  };
}

export interface InfrastructureGroup {
  id: ProjectId;
  organization: string;
  rows: InfrastructureEnvironment[];
}

/** The key combination that focuses the search field: key caps, not words. */
export const SEARCH_SHORTCUT = "⌘ K";

/** Totals across every project, as the monitoring service reports them. */
export const infrastructureSummary = { projects: 6, environments: 16, servers: 36, globalUptime: 0.9993 } as const;

export const infrastructureGroups: InfrastructureGroup[] = [
  {
    id: "console",
    organization: "Weblabs Studio",
    rows: [
      {
        domain: "next-shadcn-admin-dashboard.vercel.app/dashboard",
        platform: {
          name: "Next.js",
          icon: siNextdotjs,
        },
        environment: "expired",
        status: "unhealthy",
        latencyMs: 86,
        uptime: { days: 8, hours: 23 },
        server: "Hetzner Cloud",
        countryCode: "DE",
        plan: "CX33, Falkenstein",
        resources: { cpu: 60, ram: 73, disk: 41 },
      },
    ],
  },
  {
    id: "analytics",
    organization: "Aiy Cap",
    rows: [
      {
        domain: "next-shadcn-admin-dashboard.vercel.app/analytics",
        platform: {
          name: "React",
          icon: siReact,
        },
        environment: "production",
        status: "online",
        latencyMs: 246,
        uptime: { days: 9, hours: 23 },
        server: "AWS",
        countryCode: "NL",
        plan: "eu-west-1, Amsterdam",
        resources: { cpu: 49, ram: 42, disk: 44 },
      },
      {
        domain: "next-shadcn-admin-dashboard.vercel.app/reports",
        platform: {
          name: "Remix",
          icon: siRemix,
        },
        environment: "staging",
        status: "online",
        latencyMs: 110,
        uptime: { days: 9, hours: 23 },
        server: "Azure",
        countryCode: "EE",
        plan: "North Europe, Tallinn",
        resources: { cpu: 37, ram: 46, disk: 64 },
      },
    ],
  },
  {
    id: "kanban",
    organization: "Storeframe",
    rows: [
      {
        domain: "next-shadcn-admin-dashboard.vercel.app/kanban",
        platform: {
          name: "Node.js",
          icon: siNodedotjs,
        },
        environment: "production",
        status: "online",
        latencyMs: 25,
        uptime: { days: 10, hours: 23 },
        server: null,
        countryCode: "DE",
        plan: "EX101, Falkenstein",
        resources: { cpu: 1, ram: 21, disk: 4 },
      },
    ],
  },
  {
    id: "inbox",
    organization: "Acme Corp",
    rows: [],
  },
];
