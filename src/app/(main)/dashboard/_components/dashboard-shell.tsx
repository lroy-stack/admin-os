"use client";

import { useMessages } from "@/core/i18n/client";
import { AppRail, TopNav } from "@/ds/shell";
import { navMessageKey } from "@/navigation/shell/nav-messages";

import {
  localizeNavItems,
  localizeSearchGroups,
  shellAccounts,
  shellBrand,
  shellRailItems,
  shellSearchGroups,
  shellTopItems,
} from "./shell-data";

// Client wrappers: the nav items carry Lucide icon components, which cannot be passed from a Server Component
// to a client component as props. Both import the static route data here, translate its labels from the shell
// dictionary and hand it to the ds shell.

export function DashboardTopNav() {
  const nav = useMessages(navMessageKey);
  return (
    <TopNav
      brand={shellBrand}
      items={localizeNavItems(shellTopItems, nav)}
      accounts={shellAccounts}
      inboxHref="/dashboard/mail"
    />
  );
}

export function DashboardAppRail() {
  const nav = useMessages(navMessageKey);
  return (
    <AppRail
      items={localizeNavItems(shellRailItems, nav)}
      searchGroups={localizeSearchGroups(shellSearchGroups, nav)}
    />
  );
}
