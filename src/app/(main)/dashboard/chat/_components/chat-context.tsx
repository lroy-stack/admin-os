"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import { useChatState } from "./chat-session";
import { activeConversation, type ChatState, resolveConversations, visibleConversations } from "./chat-state";
import type { Conversation } from "./data";

/** What the windows of the chat app can be asked to open. Focus returns to the control that asked. */
export interface ChatWindows {
  openNewConversation: () => void;
}

interface ChatContextValue {
  readonly base: readonly Conversation[];
  readonly windows: ChatWindows;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatContextProvider({
  base,
  windows,
  children,
}: {
  base: readonly Conversation[];
  windows: ChatWindows;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ base, windows }), [base, windows]);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

function useChatContext(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) throw new Error("The chat app needs a ChatWorkspace above it");
  return context;
}

export function useChatWindows(): ChatWindows {
  return useChatContext().windows;
}

export interface ChatBoard {
  readonly state: ChatState;
  /** Every conversation with the session's changes, whatever the scope, tab and search. */
  readonly all: readonly Conversation[];
  /** The list: scope, tab, search and filter applied. */
  readonly visible: readonly Conversation[];
  /** The conversation the thread shows, or `null` when the list is empty. */
  readonly active: Conversation | null;
}

/** The session's chat on top of the conversations the server rendered. */
export function useChatBoard(): ChatBoard {
  const { base } = useChatContext();
  const state = useChatState();
  return useMemo(() => {
    const all = resolveConversations(base, state);
    const visible = visibleConversations(all, state);
    return { state, all, visible, active: activeConversation(all, visible, state) };
  }, [base, state]);
}
