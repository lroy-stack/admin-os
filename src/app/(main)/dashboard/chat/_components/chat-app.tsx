import { SidebarProvider } from "@/components/ui/sidebar";

import { Chat } from "./chat";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { conversations } from "./data";

/**
 * The chat app, filling its parent. The dashboard embeds it with `standaloneHref`, which adds the button that opens
 * the standalone page; `/chat` renders it on its own.
 */
export function ChatApp({ standaloneHref }: { standaloneHref?: string }) {
  return (
    <SidebarProvider className="flex h-full min-h-0 flex-col [--header-height:calc(--spacing(14))]">
      <ChatHeader standaloneHref={standaloneHref} />
      <div className="relative flex min-h-0 flex-1">
        <ChatSidebar />
        <Chat conversations={conversations} />
      </div>
    </SidebarProvider>
  );
}
