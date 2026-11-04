"use client";

import { type ReactNode, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { useMessages } from "@/core/i18n/client";

import { accounts, type Mail } from "./data";
import { type ComposeTarget, MailComposeWindow } from "./mail-compose-dialog";
import { MailContextProvider } from "./mail-context";
import { updateMail, useMailState } from "./mail-session";
import { ShortcutsDialog, useMailShortcuts } from "./mail-shortcuts";
import { type MailDraft, sendMail } from "./mail-state";
import { mailMessageKey } from "./messages";

type Compose = { target: ComposeTarget; opening: number; open: boolean };

/**
 * The mail app's client root: the messages the server rendered, the windows every part of the app opens (mounted once)
 * and the keyboard shortcuts. The session's changes live in `mail-session.ts`.
 */
export function MailWorkspace({ mails, children }: { mails: Mail[]; children: ReactNode }) {
  const text = useMessages(mailMessageKey);
  const { accountId } = useMailState();
  const [shortcuts, setShortcuts] = useState(false);
  const [compose, setCompose] = useState<Compose | null>(null);
  const opener = useRef<Element | null>(null);
  const count = useRef(0);
  const account = accounts.find((item) => item.id === accountId) ?? accounts[0];

  const windows = useMemo(
    () => ({
      openShortcuts: () => setShortcuts(true),
      openCompose: (target: ComposeTarget, returnTo?: Element | null) => {
        opener.current = returnTo ?? null;
        count.current += 1;
        setCompose({ target, opening: count.current, open: true });
      },
    }),
    [],
  );

  return (
    <MailContextProvider base={mails} windows={windows}>
      <Shortcuts />
      {children}
      <ShortcutsDialog open={shortcuts} onOpenChange={setShortcuts} />
      {compose ? (
        <MailComposeWindow
          key={compose.opening}
          target={compose.target}
          from={{ name: account.label, email: account.email }}
          open={compose.open}
          onOpenChange={(open) => setCompose((current) => (current ? { ...current, open } : current))}
          returnFocus={() => opener.current}
          onSend={(draft: MailDraft) => {
            updateMail((state) => sendMail(state, draft, new Date().toISOString()));
            toast.success(text.compose.toast.sent);
          }}
        />
      ) : null}
    </MailContextProvider>
  );
}

function Shortcuts() {
  useMailShortcuts();
  return null;
}
