import { ChatApp } from "@/app/(main)/dashboard/chat/_components/chat-app";
import { chatMessages } from "@/app/(main)/dashboard/chat/_components/messages.server";
import { pageMetadata } from "@/config/metadata.server";

export const generateMetadata = () => pageMetadata("/chat", chatMessages);

export default function Page() {
  return (
    <div className="relative h-dvh min-h-0 overflow-hidden">
      <ChatApp />
    </div>
  );
}
