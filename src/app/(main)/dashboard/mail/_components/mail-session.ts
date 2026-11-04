"use client";

import { useSyncExternalStore } from "react";

import { INITIAL_MAIL_STATE, type MailState } from "./mail-state";

/**
 * The browser's copy of the session's mail (demo-local: nothing leaves the page, a reload starts over). One module
 * instance serves the embedded and the standalone page, so a message changed on one is changed on the other.
 */
let current: MailState = INITIAL_MAIL_STATE;
const listeners = new Set<() => void>();

export function getMailState(): MailState {
  return current;
}

/** Applies a pure transition from `mail-state.ts` and tells the screens. */
export function updateMail(transition: (state: MailState) => MailState): void {
  current = transition(current);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The session's mail; the server render and hydration see the untouched state. */
export function useMailState(): MailState {
  return useSyncExternalStore(subscribe, getMailState, () => INITIAL_MAIL_STATE);
}
