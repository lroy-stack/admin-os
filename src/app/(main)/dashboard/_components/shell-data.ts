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

type GroupedSearchItem = ShellSearchItem & { groupId: string; group: string };

/** A sidebar group is keyed by its stable id; a parent item (Authentication) is its own group, keyed by its id. */
function subItemGroup(group: { id: string; label?: string }, item: { id: string; title: string }) {
  return sidebarGroupLabels.has(item.title)
    ? { groupId: group.id, group: group.label ?? "Other" }
    : { groupId: item.id, group: item.title };
}

function toSearchItems(group: { id: string; label?: string; items: NavMainItem[] }): GroupedSearchItem[] {
  return group.items.flatMap((item) => {
    if (item.subItems) {
      return item.subItems.map((sub) => ({
        id: sub.id,
        ...subItemGroup(group, item),
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
        groupId: group.id,
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
  const ids = [...new Set(items.map((item) => item.groupId))];
  return ids.flatMap((id) => {
    const members = items.filter((item) => item.groupId === id);
    const label = members[0]?.group;
    return label === undefined
      ? []
      : [{ id, label, items: members.map(({ group: _group, groupId: _groupId, ...item }) => item) }];
  });
}

export const shellSearchGroups = buildSearchGroups();

type NavLabels = Readonly<Record<string, string>>;

function labelFor(nav: NavLabels, id: string, fallback: string): string {
  return id in nav ? (nav[id] as string) : fallback;
}

export function localizeNavItems(items: readonly ShellNavItem[], nav: NavLabels): ShellNavItem[] {
  return items.map((item) => ({ ...item, title: labelFor(nav, item.id, item.title) }));
}

export function localizeSearchGroups(groups: readonly ShellSearchGroup[], nav: NavLabels): ShellSearchGroup[] {
  return groups.map((group) => ({
    ...group,
    label: labelFor(nav, group.id, group.label),
    items: group.items.map((item) => ({ ...item, label: labelFor(nav, item.id, item.label) })),
  }));
}
