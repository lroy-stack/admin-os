"use client";

import Link from "next/link";

import { format, useLocale, useMessages } from "@/core/i18n/client";

import { type DuplicateMatch, type DuplicateQuery, directoryHref, reasonOf } from "./duplicate-model";
import { customerDirectoryMessageKey } from "./messages";

export interface DuplicateNoticeProps {
  matches: readonly DuplicateMatch[];
  query: DuplicateQuery | null;
  /** Called when a link is followed, so the window can close behind the navigation. */
  onNavigate: () => void;
}

/**
 * Says that the phone or email being typed already belongs to a contact, and links to each one. The live region is
 * always mounted, so a notice that appears while typing is announced once.
 */
export function DuplicateNotice({ matches, query, onNavigate }: DuplicateNoticeProps) {
  const text = useMessages(customerDirectoryMessageKey).newContact;
  const locale = useLocale();
  return (
    <div role="status" data-slot="duplicate-notice" className="empty:hidden">
      {matches.length === 0 || query === null ? null : (
        <div className="bg-muted/50 flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <p className="font-medium">{text.duplicate.title}</p>
          <ul className="flex flex-col gap-1">
            {matches.map((match) => (
              <li key={match.id} className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  href={directoryHref(match, query)}
                  onClick={onNavigate}
                  className="text-primary underline underline-offset-4"
                >
                  {format(text.duplicate.show, locale, { name: match.name })}
                </Link>
                <span className="text-muted-foreground">{text.duplicate.reason[reasonOf(match)]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
