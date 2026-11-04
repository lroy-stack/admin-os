"use client";

import { type ReactNode, useMemo, useState } from "react";

import type { Mail } from "./data";
import { MailContextProvider } from "./mail-context";
import { ShortcutsDialog, useMailShortcuts } from "./mail-shortcuts";

/**
 * The mail app's client root: the messages the server rendered, the windows every part of the app opens (mounted once)
 * and the keyboard shortcuts. The session's changes live in `mail-session.ts`.
 */
export function MailWorkspace({ mails, children }: { mails: Mail[]; children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState(false);
  const windows = useMemo(() => ({ openShortcuts: () => setShortcuts(true) }), []);

  return (
    <MailContextProvider base={mails} windows={windows}>
      <Shortcuts />
      {children}
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
    </MailContextProvider>
  );
}

function Shortcuts() {
  useMailShortcuts();
  return null;
}
