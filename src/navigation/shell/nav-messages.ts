import { messageKey } from "@/core/i18n/client";

/** Every id the shell labels: the sidebar groups, then the links and sub-links the shell picks from the registry. */
export type NavLabelId =
  | "dashboards"
  | "pages"
  | "legacy"
  | "misc"
  | "default"
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
  | "bookings"
  | "kanban"
  | "tasks"
  | "invoice"
  | "profile"
  | "users"
  | "roles"
  | "authentication"
  | "auth-login-v1"
  | "auth-login-v2"
  | "auth-register-v1"
  | "auth-register-v2"
  | "legacy-dashboards"
  | "legacy-default"
  | "legacy-crm"
  | "legacy-finance"
  | "legacy-analytics"
  | "others";

/** Titles of the template's navigation, by stable id. Chrome strings live in `ShellMessages` (ds). */
export type NavMessages = Readonly<Record<NavLabelId, string>>;

export const navMessageKey = messageKey<NavMessages>("nav");
