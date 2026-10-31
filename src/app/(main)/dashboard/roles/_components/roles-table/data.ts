export type RoleId =
  | "owner"
  | "admin"
  | "manager"
  | "support"
  | "analyst"
  | "guest"
  | "service"
  | "billing"
  | "marketing"
  | "developer"
  | "projectLead"
  | "financeViewer";

export type RoleGroup = "needsReview" | "system" | "custom";

export type AccessLevel = "full" | "scoped" | "readOnly" | "apiAccess";

export type PermissionSetId =
  | "users"
  | "settings"
  | "billing"
  | "reports"
  | "integrations"
  | "auditLogs"
  | "projects"
  | "tasks"
  | "tickets"
  | "knowledgeBase"
  | "analytics"
  | "dashboards"
  | "exports"
  | "apiKeys"
  | "webhooks"
  | "logs"
  | "invoices"
  | "payments"
  | "campaigns"
  | "repos"
  | "deployments";

/** "system" is the built-in owner; the others are people, so their names are proper nouns. */
export type RoleOwner = "system" | "Jane Doe" | "Alex Kim" | "Chris Lee";

export type RoleStatus = "active" | "needsReview";

export type Role = {
  id: RoleId;
  group: RoleGroup;
  accessLevel: AccessLevel;
  users: number;
  permissionSets: PermissionSetId[];
  /** ISO calendar day. */
  lastReview: string;
  owner: RoleOwner;
  status: RoleStatus;
};

export const roleOwners: readonly RoleOwner[] = ["system", "Jane Doe", "Alex Kim", "Chris Lee"];

export const roles: Role[] = [
  {
    id: "owner",
    group: "needsReview",
    accessLevel: "full",
    users: 2,
    permissionSets: ["users", "settings", "billing", "reports", "integrations", "auditLogs"],
    lastReview: "2025-04-12",
    owner: "system",
    status: "needsReview",
  },
  {
    id: "admin",
    group: "needsReview",
    accessLevel: "full",
    users: 5,
    permissionSets: ["users", "settings", "reports", "billing", "integrations"],
    lastReview: "2025-04-15",
    owner: "Jane Doe",
    status: "needsReview",
  },
  {
    id: "manager",
    group: "needsReview",
    accessLevel: "scoped",
    users: 12,
    permissionSets: ["users", "reports", "projects", "tasks"],
    lastReview: "2025-04-18",
    owner: "Jane Doe",
    status: "needsReview",
  },
  {
    id: "support",
    group: "system",
    accessLevel: "scoped",
    users: 8,
    permissionSets: ["users", "tickets", "reports", "knowledgeBase"],
    lastReview: "2025-05-01",
    owner: "system",
    status: "active",
  },
  {
    id: "analyst",
    group: "system",
    accessLevel: "scoped",
    users: 6,
    permissionSets: ["reports", "analytics", "dashboards", "exports"],
    lastReview: "2025-05-05",
    owner: "system",
    status: "active",
  },
  {
    id: "guest",
    group: "system",
    accessLevel: "readOnly",
    users: 14,
    permissionSets: ["reports", "dashboards"],
    lastReview: "2025-05-06",
    owner: "system",
    status: "active",
  },
  {
    id: "service",
    group: "system",
    accessLevel: "apiAccess",
    users: 3,
    permissionSets: ["integrations", "apiKeys", "webhooks", "logs"],
    lastReview: "2025-04-22",
    owner: "system",
    status: "active",
  },
  {
    id: "billing",
    group: "custom",
    accessLevel: "scoped",
    users: 3,
    permissionSets: ["billing", "invoices", "payments", "reports"],
    lastReview: "2025-04-28",
    owner: "Alex Kim",
    status: "active",
  },
  {
    id: "marketing",
    group: "custom",
    accessLevel: "scoped",
    users: 9,
    permissionSets: ["users", "reports", "campaigns", "analytics", "exports"],
    lastReview: "2025-05-02",
    owner: "Alex Kim",
    status: "active",
  },
  {
    id: "developer",
    group: "custom",
    accessLevel: "scoped",
    users: 10,
    permissionSets: ["repos", "deployments", "settings", "apiKeys", "logs"],
    lastReview: "2025-05-03",
    owner: "Chris Lee",
    status: "active",
  },
  {
    id: "projectLead",
    group: "custom",
    accessLevel: "scoped",
    users: 7,
    permissionSets: ["projects", "tasks", "reports", "users", "settings"],
    lastReview: "2025-04-30",
    owner: "Chris Lee",
    status: "active",
  },
  {
    id: "financeViewer",
    group: "custom",
    accessLevel: "readOnly",
    users: 4,
    permissionSets: ["billing", "reports", "invoices", "dashboards"],
    lastReview: "2025-05-07",
    owner: "Jane Doe",
    status: "active",
  },
];
