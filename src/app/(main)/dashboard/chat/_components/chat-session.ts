"use client";

import { useSyncExternalStore } from "react";

import { type ChatState, INITIAL_CHAT_STATE } from "./chat-state";

/**
 * The browser's copy of the session's chat (demo-local: nothing leaves the page, a reload starts over). One module
 * instance serves the embedded and the standalone page, so a conversation changed on one is changed on the other.
 */
let current: ChatState = INITIAL_CHAT_STATE;
const listeners = new Set<() => void>();

export function getChatState(): ChatState {
  return current;
}

/** Applies a pure transition from `chat-state.ts` and tells the screens. */
export function updateChat(transition: (state: ChatState) => ChatState): void {
  current = transition(current);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The session's chat; the server render and hydration see the untouched state. */
export function useChatState(): ChatState {
  return useSyncExternalStore(subscribe, getChatState, () => INITIAL_CHAT_STATE);
}
