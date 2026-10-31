import { LocaleBundles } from "@/app/_components/locale-root";
import { SidebarProvider } from "@/components/ui/sidebar";
import { getLocale } from "@/config/locale.server";

import { Chat } from "./chat";
import { ChatHeader } from "./chat-header";
import { ChatSidebar } from "./chat-sidebar";
import { createConversations } from "./data";
import { chatBundle, chatMessages } from "./messages.server";

/**
 * The chat app, filling its parent. The dashboard embeds it with `standaloneHref`, which adds the button that opens
 * the standalone page; `/chat` renders it on its own. The demo conversations are written for the request's locale
 * here, once, so both routes show the same content and no other locale reaches the browser.
 */
export async function ChatApp({ standaloneHref }: { standaloneHref?: string }) {
  const locale = await getLocale();
  const conversations = createConversations(chatMessages[locale], locale);

  return (
    <LocaleBundles bundles={[chatBundle]}>
      <SidebarProvider className="flex h-full min-h-0 flex-col [--header-height:calc(--spacing(14))]">
        <ChatHeader standaloneHref={standaloneHref} />
        <div className="relative flex min-h-0 flex-1">
          <ChatSidebar />
          <Chat conversations={conversations} />
        </div>
      </SidebarProvider>
    </LocaleBundles>
  );
}
