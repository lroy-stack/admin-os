import {
  Banknote,
  Calendar,
  ChartBar,
  CheckSquare,
  FolderOpen,
  Forklift,
  Gauge,
  GraduationCap,
  HeartPulse,
  Kanban,
  ListTodo,
  Lock,
  type LucideIcon,
  Mail,
  MessageSquare,
  Package,
  ReceiptText,
  Server,
  ShoppingBag,
  UserRound,
  Users,
} from "lucide-react";

import type { ExampleLabelId } from "./examples-messages";

export interface ExampleItem {
  readonly id: ExampleLabelId;
  /** English source title; the translations live in `examples-messages.server.ts`. */
  readonly title: string;
  readonly url: string;
  readonly icon?: LucideIcon;
  /** Where the shell pins it besides the search dialog: a top-nav pill (`area`) or a rail button (`tool`). */
  readonly placement?: "area" | "tool";
  readonly newTab?: boolean;
}

export interface ExampleGroup {
  readonly id: ExampleLabelId;
  readonly items: readonly ExampleItem[];
}

/**
 * The template's showcase screens (ADR 0006). They are static, not gated and shown only in the template demo,
 * after the active preset's own entries. Group and item ids are the keys of the translations.
 */
export const examplesNav: readonly ExampleGroup[] = [
  {
    id: "dashboards",
    items: [
      { id: "crm", title: "Pipeline", url: "/dashboard/crm", icon: ChartBar, placement: "area" },
      { id: "finance", title: "Finance", url: "/dashboard/finance", icon: Banknote, placement: "area" },
      { id: "analytics", title: "Growth", url: "/dashboard/analytics", icon: Gauge, placement: "area" },
      { id: "productivity", title: "Productivity", url: "/dashboard/productivity", icon: ListTodo },
      { id: "ecommerce", title: "E-commerce", url: "/dashboard/ecommerce", icon: ShoppingBag },
      { id: "academy", title: "Academy", url: "/dashboard/academy", icon: GraduationCap },
      { id: "logistics", title: "Logistics", url: "/dashboard/logistics", icon: Forklift },
      { id: "infrastructure", title: "Infrastructure", url: "/dashboard/infrastructure", icon: Server },
      {
        id: "file-manager",
        title: "File Manager",
        url: "/dashboard/file-manager",
        icon: FolderOpen,
        placement: "tool",
      },
      { id: "patient-monitoring", title: "Patient Monitoring", url: "/dashboard/patient-monitoring", icon: HeartPulse },
    ],
  },
  {
    id: "pages",
    items: [
      { id: "products", title: "Products", url: "/dashboard/products", icon: Package, placement: "tool" },
      { id: "email", title: "Email", url: "/dashboard/mail", icon: Mail, placement: "tool" },
      { id: "chat", title: "Chat", url: "/dashboard/chat", icon: MessageSquare, placement: "tool" },
      { id: "calendar", title: "Schedule", url: "/dashboard/calendar", icon: Calendar, placement: "area" },
      { id: "kanban", title: "Projects", url: "/dashboard/kanban", icon: Kanban, placement: "area" },
      { id: "tasks", title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare, placement: "tool" },
      { id: "invoice", title: "Invoice", url: "/dashboard/invoice", icon: ReceiptText, placement: "tool" },
      { id: "profile", title: "Profile", url: "/dashboard/profile", icon: UserRound },
      { id: "users", title: "Customers", url: "/dashboard/users", icon: Users, placement: "area" },
      { id: "roles", title: "Roles", url: "/dashboard/roles", icon: Lock },
    ],
  },
  {
    id: "authentication",
    items: [
      { id: "auth-login-v1", title: "Login v1", url: "/auth/v1/login", newTab: true },
      { id: "auth-login-v2", title: "Login v2", url: "/auth/v2/login", newTab: true },
      { id: "auth-register-v1", title: "Register v1", url: "/auth/v1/register", newTab: true },
      { id: "auth-register-v2", title: "Register v2", url: "/auth/v2/register", newTab: true },
    ],
  },
  {
    id: "legacy",
    items: [
      { id: "legacy-default", title: "Default V1", url: "/dashboard/default-v1" },
      { id: "legacy-crm", title: "CRM V1", url: "/dashboard/crm-v1" },
      { id: "legacy-finance", title: "Finance V1", url: "/dashboard/finance-v1" },
      { id: "legacy-analytics", title: "Analytics V1", url: "/dashboard/analytics-v1" },
    ],
  },
];
