import type { Metadata } from "next";

import { ChatApp } from "@/app/(main)/dashboard/chat/_components/chat-app";

export const metadata: Metadata = {
  title: "Open Source Chat Interface with shadcn/ui",
  description:
    "Explore an open source chat interface with conversation search, message threads, internal notes, and contact details.",
  alternates: {
    canonical: "/chat",
  },
};

export default function Page() {
  return (
    <div className="relative h-dvh min-h-0 overflow-hidden">
      <ChatApp />
    </div>
  );
}
