"use client";

import { APP_CONFIG } from "@/config/app-config";
import { useMessages } from "@/core/i18n/client";
import { AppRail, type ShellAccount, type ShellBrand, type ShellChoice, TopNav } from "@/ds/shell";

import { examplesMessageKey } from "../(examples)/_nav/examples-messages";
import { examplesNav } from "../(examples)/_nav/examples-nav";
import { resetDemoData, setDemoPreset, setDemoRole } from "./demo-actions";
import { buildShellNav, type NavData } from "./nav-model";

// Client wrappers: nav entries carry Lucide icon components, which cannot cross from a Server Component. The
// server decides what the actor may see and sends ids and labels (`NavData`); these wrappers pick the entries from
// the active preset's manifest, add the showcase screens and hand the lists to the props-driven ds shell.

const brand: ShellBrand = { name: APP_CONFIG.name, href: "/dashboard/default" };

function useShellNav(data: NavData) {
  const text = useMessages(examplesMessageKey);
  return buildShellNav(data, { groups: examplesNav, text });
}

export interface DemoData {
  readonly role: { readonly value: string; readonly options: readonly ShellChoice[] };
  readonly preset: { readonly value: string; readonly options: readonly ShellChoice[] };
}

export function DashboardTopNav({
  nav,
  account,
  demo,
}: {
  nav: NavData;
  account: ShellAccount;
  /** Present on the demo build only. */
  demo?: DemoData;
}) {
  const { top } = useShellNav(nav);
  return (
    <TopNav
      brand={brand}
      items={top}
      account={account}
      demo={
        demo && {
          role: { ...demo.role, onSelect: setDemoRole },
          preset: { ...demo.preset, onSelect: setDemoPreset },
          onReset: resetDemoData,
        }
      }
      inboxHref="/dashboard/mail"
    />
  );
}

export function DashboardAppRail({ nav }: { nav: NavData }) {
  const { rail, searchGroups } = useShellNav(nav);
  return <AppRail items={rail} searchGroups={searchGroups} />;
}
