import type { ReactNode } from "react";

import { SidebarProvider } from "@/components/ui/sidebar";

import { ChatHeader } from "./_components/chat-header";
import { ChatSidebar } from "./_components/chat-sidebar";

export default async function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // Full-height app page: the dashboard drops its content padding and the chat panes fill the rest of the screen.
    <div
      data-content-padding="false"
      className="bg-background relative h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 overflow-hidden rounded-lg border [--header-height:calc(--spacing(14))]"
    >
      <SidebarProvider className="flex h-full min-h-0 flex-col">
        <ChatHeader />
        <div className="relative flex min-h-0 flex-1">
          <ChatSidebar />
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
