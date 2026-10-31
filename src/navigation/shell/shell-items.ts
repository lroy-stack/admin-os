import { type NavMainLinkItem, sidebarItems } from "@/navigation/sidebar/sidebar-items";

// The shell picks its entries from the sidebar registry so titles, urls and icons stay in one place.
const TOP_NAV_IDS = ["default", "crm", "users", "calendar", "reservas", "finance", "analytics", "kanban"] as const;
const RAIL_IDS = ["tasks", "email", "chat", "file-manager", "invoice", "products"] as const;

const linkItems = sidebarItems
  .flatMap((group) => group.items)
  .filter((item): item is NavMainLinkItem => !item.subItems && !item.disabled);

function pickLinks(ids: readonly string[]): NavMainLinkItem[] {
  return ids.flatMap((id) => linkItems.find((item) => item.id === id) ?? []);
}

export const topNavItems = pickLinks(TOP_NAV_IDS);

export const railItems = pickLinks(RAIL_IDS);
