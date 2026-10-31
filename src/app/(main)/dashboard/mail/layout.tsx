import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

import { MailSidebar } from "./_components/mail-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // Full-height app page: the dashboard drops its content padding and the mail panes fill the rest of the screen.
    <div
      data-content-padding="false"
      className="bg-background relative h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 overflow-hidden rounded-lg border"
    >
      <SidebarProvider className="h-full min-h-0">
        <MailSidebar />
        <div className="size-full">{children}</div>
      </SidebarProvider>
    </div>
  );
}
