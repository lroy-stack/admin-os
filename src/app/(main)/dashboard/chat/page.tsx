import type { Metadata } from "next";

import { ChatApp } from "./_components/chat-app";

export const metadata: Metadata = {
  title: "Open Source Chat Interface with shadcn/ui",
  description:
    "Explore an open source chat interface with conversation search, message threads, internal notes, and contact details.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/chat",
  },
};

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
