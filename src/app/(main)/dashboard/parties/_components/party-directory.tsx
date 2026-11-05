"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";
import { SearchCapsule, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { ReadState } from "@/ds/feedback";
import type { CapabilityActionOptions } from "@/ds/forms";

import { useOpenWindow } from "../../_components/use-open-window";
import { type PartyRow, ROLE_FILTERS, type RoleFilter, visibleRows } from "./directory-model";
import { partyDirectoryMessageKey } from "./messages";
import { PartyCard } from "./party-card";
import { PartyFormWindow } from "./party-form-dialog";
import { PartyPanel } from "./party-panel";

export interface DirectoryPager {
  /** The page after this one, or null on the last page. */
  readonly nextHref: string | null;
  /** The first page, or null when this is the first page. */
  readonly firstHref: string | null;
}

type Target = { readonly kind: "panel" | "edit"; readonly party: PartyRow } | { readonly kind: "create" };

export function PartyDirectory({
  state,
  reason,
  parties,
  initialQuery,
  pager,
  errors,
  canManage,
}: {
  state: ReadStatus;
  /** The translated reason of a failed read. */
  reason?: string;
  parties: readonly PartyRow[];
  /** The search the page was opened with (`?q=`). */
  initialQuery: string;
  pager: DirectoryPager;
  /** The parties module's error texts, for the windows. */
  errors: CapabilityActionOptions["errors"];
  /** Whether the actor holds `manage:parties`: without it there is no Add and no Edit. */
  canManage: boolean;
}) {
  const text = useMessages(partyDirectoryMessageKey);
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState<RoleFilter>("all");
  const windows = useOpenWindow<Target>();

  const roleOptions: SegmentedOption<RoleFilter>[] = ROLE_FILTERS.map((value) => ({
    value,
    label: text.role[value],
  }));
  const visible = visibleRows(parties, { query, role });
  const trimmedQuery = query.trim();
  const filtered = role !== "all" || trimmedQuery !== "";
  const shown = windows.shown;
  const target = shown?.value;
  const panelParty = target?.kind === "panel" ? target.party : null;
  const formParty = target?.kind === "edit" ? target.party : null;

  let emptyDescription = text.empty.description;
  if (filtered) {
    emptyDescription =
      trimmedQuery === "" ? text.empty.noMatchFilter : format(text.empty.noMatch, locale, { query: trimmedQuery });
  }

  return (
    <ReadState
      state={state.status === "empty" ? { status: "ready" } : state}
      reason={reason}
      onRetry={() => router.refresh()}
      emptyTitle={text.empty.title}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchCapsule
            label={text.search.label}
            placeholder={text.search.placeholder}
            value={query}
            onValueChange={setQuery}
            className="sm:w-72"
          />
          <SegmentedControl label={text.roleLabel} value={role} options={roleOptions} onValueChange={setRole} />
          {canManage && (
            <Button
              variant="ghost"
              className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs lg:ml-auto"
              onClick={(event) => windows.show({ kind: "create" }, event.currentTarget)}
            >
              <Plus data-icon="inline-start" />
              {text.create.verb}
            </Button>
          )}
        </div>

        <ReadState
          state={{ status: visible.length === 0 ? "empty" : "ready" }}
          emptyTitle={filtered ? text.empty.noMatchTitle : text.empty.title}
          emptyDescription={emptyDescription}
        >
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((party) => (
              <li key={party.id} className="flex *:flex-1">
                <PartyCard
                  party={party}
                  onOpen={(row, opener) => windows.show({ kind: "panel", party: row }, opener)}
                />
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

      {shown !== null && panelParty !== null ? (
        <PartyPanel
          key={shown.opening}
          party={panelParty}
          open={shown.open}
          onOpenChange={windows.onOpenChange}
          returnFocus={windows.returnFocus}
          {...(canManage
            ? { onEdit: () => windows.show({ kind: "edit", party: panelParty }, windows.returnFocus()) }
            : {})}
        />
      ) : null}
      {shown !== null && target?.kind !== "panel" ? (
        <PartyFormWindow
          key={shown.opening}
          party={formParty}
          open={shown.open}
          onOpenChange={windows.onOpenChange}
          returnFocus={windows.returnFocus}
          errors={errors}
        />
      ) : null}
    </ReadState>
  );
}
