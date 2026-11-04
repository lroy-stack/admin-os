"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { useMessages } from "@/core/i18n/client";

import { ChatContextProvider } from "./chat-context";
import { updateChat } from "./chat-session";
import { createConversation } from "./chat-state";
import type { Conversation } from "./data";
import { chatMessageKey } from "./messages";
import { NewConversationWindow } from "./new-conversation-dialog";

/**
 * The chat app's client root: the conversations the server rendered and the windows every part of the app opens
 * (mounted once). The session's changes live in `chat-session.ts`.
 */
export function ChatWorkspace({ conversations, children }: { conversations: Conversation[]; children: ReactNode }) {
  const text = useMessages(chatMessageKey);
  const [opening, setOpening] = useState<{ count: number; open: boolean } | null>(null);
  const count = useRef(0);

  const windows = useMemo(
    () => ({
      openNewConversation: () => {
        count.current += 1;
        setOpening({ count: count.current, open: true });
      },
    }),
    [],
  );

  return (
    <ChatContextProvider base={conversations} windows={windows}>
      {children}
      {opening ? (
        <NewConversationWindow
          key={opening.count}
          open={opening.open}
          onOpenChange={(open) => setOpening((current) => (current ? { ...current, open } : current))}
          returnFocus={undefined}
          onStart={(values) => {
            updateChat((state) =>
              createConversation(state, {
                ...values,
                words: { time: text.time.justNow, day: text.list.groups.today, status: text.status.lead },
              }),
            );
            toast.success(text.newConversation.toast);
          }}
        />
      ) : null}
    </ChatContextProvider>
  );
}
