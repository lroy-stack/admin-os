import { pageMetadata } from "@/config/metadata.server";

import { ChatApp } from "./_components/chat-app";
import { chatMessages } from "./_components/messages.server";

// The embedded page is a copy of /chat: it names the standalone page as canonical and stays out of the index.
export const generateMetadata = () => pageMetadata("/chat", chatMessages, { robots: { index: false, follow: true } });

export default function Page() {
  return (
    // Full-height app page: the dashboard drops its content padding and the chat panes fill the rest of the screen.
    <div
      data-content-padding="false"
      className="bg-background relative h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 overflow-hidden rounded-lg border"
    >
      <ChatApp standaloneHref="/chat" />
    </div>
  );
}
