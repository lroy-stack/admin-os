import type { ReactNode } from "react";

import { cn } from "cn";

import { LocaleRoot } from "@/app/_components/locale-root";
import { commonBundle } from "@/components/common-messages.server";
import { AppBackdrop } from "@/ds/shell";
import { shellBundle } from "@/ds/shell/server";
import { navBundle } from "@/navigation/shell/nav-messages.server";

import { DashboardAppRail, DashboardTopNav } from "./_components/dashboard-shell";
import { dashboardBundle } from "./_components/messages.server";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <LocaleRoot
      bundles={[shellBundle, navBundle, commonBundle, dashboardBundle]}
      className={cn(
        "relative isolate flex min-h-svh flex-col",
        // Space above and below full-height app pages (kanban, logistics…): header plus content gutters.
        "[--dashboard-header-height:14rem] md:[--dashboard-header-height:9rem] xl:[--dashboard-header-height:5.25rem]",
      )}
    >
      <AppBackdrop />
      <DashboardTopNav />
      {/* Pages can set data-content-padding="false" for full-height app layouts that manage their own spacing. */}
      <div className="flex min-w-0 flex-1 gap-4 px-4 pt-2 pb-24 has-data-[content-padding=false]:pt-0 md:gap-6 md:px-6 md:pt-4 md:pb-8 md:has-data-[content-padding=false]:pb-4">
        <DashboardAppRail />
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
    </LocaleRoot>
  );
}
