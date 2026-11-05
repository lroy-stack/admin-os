"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";
import { SearchCapsule } from "@/ds/components";
import { ReadState } from "@/ds/feedback";

import { staffDirectoryMessageKey } from "./messages";
import { StaffCard } from "./staff-card";
import { type TeamCard, visibleCards } from "./team-model";

export interface DirectoryPager {
  /** The page after this one, or null on the last page. */
  readonly nextHref: string | null;
  /** The first page, or null when this is the first page. */
  readonly firstHref: string | null;
}

export function StaffDirectory({
  state,
  reason,
  cards,
  pager,
}: {
  state: ReadStatus;
  /** The translated reason of a failed read. */
  reason?: string;
  cards: readonly TeamCard[];
  pager: DirectoryPager;
}) {
  const text = useMessages(staffDirectoryMessageKey);
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const visible = visibleCards(cards, query);

  return (
    <ReadState
      state={state}
      reason={reason}
      onRetry={() => router.refresh()}
      emptyTitle={text.empty.noMembersTitle}
      emptyDescription={text.empty.noMembers}
    >
      <div className="flex flex-col gap-4">
        <SearchCapsule
          label={text.search.label}
          placeholder={text.search.placeholder}
          value={query}
          onValueChange={setQuery}
          className="sm:w-72"
        />

        <ReadState
          state={{ status: visible.length === 0 ? "empty" : "ready" }}
          emptyTitle={text.empty.noMatchTitle}
          emptyDescription={format(text.empty.noMatch, locale, { query: query.trim() })}
        >
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map((member) => (
              <li key={member.id}>
                <StaffCard member={member} text={text} />
              </li>
            ))}
          </ul>
        </ReadState>

        {(pager.nextHref !== null || pager.firstHref !== null) && (
          <nav aria-label={text.pager.label} className="flex flex-wrap items-center gap-2">
            {pager.firstHref !== null && (
              <Button asChild variant="outline" size="sm">
                <Link href={pager.firstHref}>{text.pager.first}</Link>
              </Button>
            )}
            {pager.nextHref !== null && (
              <Button asChild variant="outline" size="sm">
                <Link href={pager.nextHref}>{text.pager.next}</Link>
              </Button>
            )}
          </nav>
        )}
      </div>
    </ReadState>
  );
}
