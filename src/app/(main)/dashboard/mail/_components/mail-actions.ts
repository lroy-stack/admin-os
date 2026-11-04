"use client";

import { useMemo } from "react";

import { useMessages } from "@/core/i18n/client";
import { useToastWithUndo } from "@/ds/feedback";

import type { Mail } from "./data";
import { useMailbox } from "./mail-context";
import { getMailState, updateMail } from "./mail-session";
import {
  entryOf,
  focusMail,
  markUnread,
  moveTo,
  neighbour,
  nextAfterRemoval,
  restoreEntry,
  selectMail,
  togglePin,
} from "./mail-state";
import { mailMessageKey } from "./messages";

/** Puts focus on a message of the list, or on the search field when the list has none left. */
function focusListItem(id: string | null) {
  requestAnimationFrame(() => {
    const target =
      (id === null ? null : document.querySelector<HTMLElement>(`[data-mail-id="${CSS.escape(id)}"]`)) ??
      document.querySelector<HTMLElement>("[data-mail-search]");
    target?.focus();
  });
}

export interface MailActions {
  /** Opens the message `step` places away in the list; does nothing at either end. */
  step: (step: 1 | -1) => void;
  archive: (mail: Mail, leave?: () => void) => void;
  trash: (mail: Mail, leave?: () => void) => void;
  togglePin: (mail: Mail) => void;
  markUnread: (mail: Mail) => void;
}

/**
 * What a person can do to the open message, on the session's mail, with undo for what removes it from the list.
 * `leave` is called by the phone layout, where the message is a drawer that closes when its message goes.
 */
export function useMailActions(): MailActions {
  const { order } = useMailbox();
  const text = useMessages(mailMessageKey);
  const withUndo = useToastWithUndo();

  return useMemo(() => {
    function move(mail: Mail, folder: Mail["folder"], message: string, leave?: () => void) {
      const before = entryOf(getMailState(), mail.id);
      const next = nextAfterRemoval(order, mail.id);
      updateMail((state) => {
        const moved = moveTo(state, mail.id, folder);
        if (state.selected !== mail.id) return moved;
        return leave || next === null ? focusMail(moved, null) : selectMail(moved, next);
      });
      if (leave) leave();
      else focusListItem(next);
      withUndo({
        message,
        undo: () => updateMail((state) => focusMail(restoreEntry(state, mail.id, before), mail.id)),
      });
    }

    return {
      step: (step) => {
        const current = getMailState().selected;
        const target = current === null ? (order[0]?.id ?? null) : neighbour(order, current, step);
        if (target !== null) updateMail((state) => selectMail(state, target));
      },
      archive: (mail, leave) => move(mail, "archive", text.view.toast.archived, leave),
      trash: (mail, leave) => move(mail, "trash", text.view.toast.trashed, leave),
      togglePin: (mail) => updateMail((state) => togglePin(state, mail)),
      markUnread: (mail) => updateMail((state) => markUnread(state, mail.id)),
    };
  }, [order, text, withUndo]);
}
