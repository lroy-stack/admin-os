import { APP_CONFIG } from "@/config/app-config";
import { users } from "@/data/users";
import type { ShellAccount, ShellBrand, ShellNavItem, ShellSearchGroup, ShellSearchItem } from "@/ds/shell";
import { railItems, topNavItems } from "@/navigation/shell/shell-items";
import { type NavMainItem, sidebarItems } from "@/navigation/sidebar/sidebar-items";

export const shellBrand: ShellBrand = { name: APP_CONFIG.name, href: "/dashboard/default" };

export const shellTopItems: readonly ShellNavItem[] = topNavItems;

export const shellRailItems: readonly ShellNavItem[] = railItems;

export const shellAccounts: readonly ShellAccount[] = users;

const sidebarGroupLabels = new Set(sidebarItems.flatMap((group) => (group.label ? [group.label] : [])));

function getSubItemGroup(groupLabel: string | undefined, itemTitle: string) {
  return sidebarGroupLabels.has(itemTitle) ? (groupLabel ?? "Other") : itemTitle;
}

type GroupedSearchItem = ShellSearchItem & { group: string };

function toSearchItems(group: { label?: string; items: NavMainItem[] }): GroupedSearchItem[] {
  return group.items.flatMap((item) => {
    if (item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        group: getSubItemGroup(group.label, item.title),
        label: sub.title,
        url: sub.url,
        icon: item.icon,
        disabled: sub.disabled,
        newTab: sub.newTab,
        suggested: !sub.disabled && !sub.url.includes("coming-soon"),
      }));
    }
    return [
      {
        id: item.id,
        group: group.label ?? "Other",
        label: item.title,
        url: item.url,
        icon: item.icon,
        disabled: item.disabled,
        newTab: item.newTab,
        suggested: !item.disabled && !item.url.includes("coming-soon"),
      },
    ];
  });
}

function buildSearchGroups(): ShellSearchGroup[] {
  const items = sidebarItems.flatMap(toSearchItems);
  const labels = [...new Set(items.map((item) => item.group))];
  return labels.map((label) => ({
    label,
    items: items.filter((item) => item.group === label).map(({ group: _group, ...item }) => item),
  }));
}

export const shellSearchGroups = buildSearchGroups();
