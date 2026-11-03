import { messageKey } from "@/core/i18n/client";

/** Every id of `examplesNav`: its groups, then its items. */
export type ExampleLabelId =
  | "dashboards"
  | "pages"
  | "legacy"
  | "crm"
  | "finance"
  | "analytics"
  | "productivity"
  | "ecommerce"
  | "academy"
  | "logistics"
  | "infrastructure"
  | "file-manager"
  | "patient-monitoring"
  | "products"
  | "email"
  | "chat"
  | "calendar"
  | "kanban"
  | "tasks"
  | "invoice"
  | "profile"
  | "users"
  | "roles"
  | "kit"
  | "authentication"
  | "auth-login-v1"
  | "auth-login-v2"
  | "auth-register-v1"
  | "auth-register-v2"
  | "legacy-default"
  | "legacy-crm"
  | "legacy-finance"
  | "legacy-analytics";

/** Titles of the template's showcase screens, by stable id. Chrome strings live in `ShellMessages` (ds). */
export type ExamplesMessages = Readonly<Record<ExampleLabelId, string>>;

export const examplesMessageKey = messageKey<ExamplesMessages>("examples");
