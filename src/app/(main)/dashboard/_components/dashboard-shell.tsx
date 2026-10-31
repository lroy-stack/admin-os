"use client";

import { AppRail, TopNav } from "@/ds/shell";

import { shellAccounts, shellBrand, shellRailItems, shellSearchGroups, shellTopItems } from "./shell-data";

// Client wrappers: the nav items carry Lucide icon components, which cannot be passed from a Server Component
// to a client component as props. Both import the static route data here and hand it to the ds shell.

export function DashboardTopNav() {
  return <TopNav brand={shellBrand} items={shellTopItems} accounts={shellAccounts} inboxHref="/dashboard/mail" />;
}

export function DashboardAppRail() {
  return <AppRail items={shellRailItems} searchGroups={shellSearchGroups} />;
}
