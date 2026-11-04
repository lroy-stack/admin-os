"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";

import type { Mail } from "./data";
import { useMailState } from "./mail-session";
import { displayOrder, type MailState, resolveMails, visibleMails } from "./mail-state";

/** What the windows of the mail app can be asked to open. Focus returns to the control that asked. */
export interface MailWindows {
  openShortcuts: () => void;
}

interface MailContextValue {
  readonly base: readonly Mail[];
  readonly windows: MailWindows;
}

const MailContext = createContext<MailContextValue | null>(null);

export function MailContextProvider({
  base,
  windows,
  children,
}: {
  base: readonly Mail[];
  windows: MailWindows;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ base, windows }), [base, windows]);
  return <MailContext.Provider value={value}>{children}</MailContext.Provider>;
}

function useMailContext(): MailContextValue {
  const context = useContext(MailContext);
  if (!context) throw new Error("The mail app needs a MailWorkspace above it");
  return context;
}

export function useMailWindows(): MailWindows {
  return useMailContext().windows;
}

export interface Mailbox {
  readonly state: MailState;
  /** Every message with the session's changes, in every folder. */
  readonly all: readonly Mail[];
  /** The list: the folder, the search and the sort applied. */
  readonly visible: readonly Mail[];
  /** The list in reading order (pinned first); next and previous follow it. */
  readonly order: readonly Mail[];
  readonly selected: Mail | null;
}

/** The session's mail on top of the messages the server rendered. */
export function useMailbox(): Mailbox {
  const { base } = useMailContext();
  const state = useMailState();
  return useMemo(() => {
    const all = resolveMails(base, state);
    const visible = visibleMails(all, state);
    return {
      state,
      all,
      visible,
      order: displayOrder(visible),
      selected: all.find((mail) => mail.id === state.selected) ?? null,
    };
  }, [base, state]);
}
