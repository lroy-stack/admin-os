"use client";

import { useEffect } from "react";

import { Kbd } from "@/components/ui/kbd";
import { useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import { useMailActions } from "./mail-actions";
import { useMailbox } from "./mail-context";
import { mailMessageKey } from "./messages";

/** Keys that belong to a control, a window or a menu are theirs: the shortcuts stay out of the way. */
const OWNED = "input,textarea,select,[contenteditable],[role=dialog],[role=alertdialog],[role=menu]";

/** The shortcuts of the mail app. Each key does what the shortcuts window says it does. */
export function useMailShortcuts() {
  const { selected } = useMailbox();
  const actions = useMailActions();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest(OWNED)) return;
      switch (event.key) {
        case "j":
          actions.step(1);
          break;
        case "k":
          actions.step(-1);
          break;
        case "e":
          if (selected && selected.folder !== "archive") actions.archive(selected);
          break;
        case "/":
          document.querySelector<HTMLElement>("[data-mail-search]")?.focus();
          break;
        default:
          return;
      }
      event.preventDefault();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [actions, selected]);
}

/** What each shortcut does, in the order the window lists them; `useMailShortcuts` binds the same keys. */
const SHORTCUT_KEYS = [
  { key: "j", action: "next" },
  { key: "k", action: "previous" },
  { key: "e", action: "archive" },
  { key: "/", action: "search" },
] as const;

/** The window behind "Keyboard shortcuts". */
export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const text = useMessages(mailMessageKey).shortcuts;

  return (
    <QuickDialog open={open} onOpenChange={onOpenChange} title={text.title} description={text.description}>
      <dl className="divide-border divide-y">
        {SHORTCUT_KEYS.map(({ key, action }) => (
          <div key={key} className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-sm">{text[action]}</dt>
            <dd>
              <Kbd>{key}</Kbd>
            </dd>
          </div>
        ))}
      </dl>
    </QuickDialog>
  );
}
