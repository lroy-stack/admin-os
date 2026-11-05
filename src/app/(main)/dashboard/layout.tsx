import type { ReactNode } from "react";

import { cn } from "cn";

import { LocaleRoot } from "@/app/_components/locale-root";
import { commonBundle } from "@/components/common-messages.server";
import { DEMO_PERSON } from "@/config/actor";
import { bellRuntimeOf, bellUnread } from "@/config/bell.server";
import { isDemoAdapter } from "@/config/data.server";
import { getRuntime } from "@/config/runtime";
import { VERTICALS } from "@/config/vertical";
import { textFor } from "@/config/vocabulary.server";
import { AccessProvider } from "@/core/access/client";
import { visibleNavIds } from "@/core/nav";
import { feedbackBundle } from "@/ds/feedback/server";
import { overlaysBundle } from "@/ds/overlays/server";
import { AppBackdrop } from "@/ds/shell";
import { shellBundle } from "@/ds/shell/server";

import { demoMessages } from "./_components/demo-messages.server";
import { dashboardBundle } from "./_components/messages.server";
import { DashboardAppRail, DashboardTopNav } from "./_components/nav-client";
import type { NavData } from "./_components/nav-model";
import { examplesBundle } from "./(examples)/_nav/examples-messages.server";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  const { actor, vertical, locale, client } = await getRuntime();
  const demo = isDemoAdapter();

  // The server decides what the actor may see; the client receives only the ids and plain labels (ADR 0006).
  const visibleIds = visibleNavIds(vertical.nav, actor, vertical.modules);
  const visible = vertical.nav.filter((entry) => visibleIds.includes(entry.id));
  const nav: NavData = {
    presetId: vertical.id,
    visibleIds,
    labels: Object.fromEntries(visible.map((entry) => [entry.id, textFor(vertical.id, locale, entry.labelKey)])),
    groupLabels: Object.fromEntries(
      [...new Set(visible.map((entry) => entry.group))].map((group) => [
        group,
        textFor(vertical.id, locale, `nav.groups.${group}`),
      ]),
    ),
    showExamples: demo,
  };

  // The bell shows the actor's real unread count (approvals and feeds); the panel reads the rows only when it opens.
  const unreadNotifications = await bellUnread(bellRuntimeOf({ client, actor, locale }));

  const roles = vertical.roles.map((role) => ({ id: role.id, label: textFor(vertical.id, locale, role.labelKey) }));
  const account = {
    id: actor.actorId,
    name: actor.displayName ?? actor.roleId,
    email: DEMO_PERSON.email,
    avatar: "",
    role: roles.find((role) => role.id === actor.roleId)?.label ?? actor.roleId,
  };

  return (
    <LocaleRoot
      bundles={[shellBundle, feedbackBundle, overlaysBundle, examplesBundle, commonBundle, dashboardBundle]}
      className={cn(
        "relative isolate flex min-h-svh flex-col",
        // Space above and below full-height app pages (kanban, logistics…): header plus content gutters.
        "[--dashboard-header-height:14rem] md:[--dashboard-header-height:9rem] xl:[--dashboard-header-height:5.25rem]",
      )}
    >
      <AccessProvider permissions={actor.permissions}>
        <AppBackdrop />
        <DashboardTopNav
          nav={nav}
          account={account}
          unreadNotifications={unreadNotifications}
          demo={
            demo
              ? {
                  role: { value: actor.roleId, options: roles },
                  preset: {
                    value: vertical.id,
                    options: Object.keys(VERTICALS).map((id) => ({
                      id,
                      label: demoMessages[locale][id as keyof typeof VERTICALS],
                    })),
                  },
                }
              : undefined
          }
        />
        {/* Pages can set data-content-padding="false" for full-height app layouts that manage their own spacing. */}
        <div className="flex min-w-0 flex-1 gap-4 px-4 pt-2 pb-24 has-data-[content-padding=false]:pt-0 md:gap-6 md:px-6 md:pt-4 md:pb-8 md:has-data-[content-padding=false]:pb-4">
          <DashboardAppRail nav={nav} />
          <main
            className={cn(
              "min-w-0 flex-1",
              "[html[data-content-layout=centered]_&>*]:mx-auto",
              "[html[data-content-layout=centered]_&>*]:w-full",
              "[html[data-content-layout=centered]_&>*]:max-w-screen-2xl",
            )}
          >
            {children}
          </main>
        </div>
      </AccessProvider>
    </LocaleRoot>
  );
}
