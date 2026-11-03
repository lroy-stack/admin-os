"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Download, ListFilter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";
import { SearchCapsule, SegmentedControl, type SegmentedOption } from "@/ds/components";
import { ReadState } from "@/ds/feedback";
import type { CapabilityActionOptions } from "@/ds/forms";
import { downloadCsv, toCsv } from "@/lib/csv";

import { CustomerCard } from "./customer-card";
import { CustomersTable } from "./customers-table";
import {
  type CustomerRow,
  csvColumns,
  isSortKey,
  SORT_KEYS,
  type SortKey,
  STATUS_FILTERS,
  type StatusFilter,
  visibleRows,
} from "./directory-model";
import { customerDirectoryMessageKey } from "./messages";
import { NewContactDialog } from "./new-contact-dialog";

type View = "grid" | "table";

const EXPORT_FILE = "customers.csv";

export interface DirectoryPager {
  /** The page after this one, or null on the last page. */
  readonly nextHref: string | null;
  /** The first page, or null when this is the first page. */
  readonly firstHref: string | null;
}

export function CustomerDirectory({
  state,
  reason,
  customers,
  pager,
  errors,
  initialQuery,
}: {
  state: ReadStatus;
  /** The translated reason of a failed read. */
  reason?: string;
  customers: readonly CustomerRow[];
  pager: DirectoryPager;
  /** The customers module's error texts, for the New contact window. */
  errors: CapabilityActionOptions["errors"];
  /** The search the page was opened with (`?q=`), e.g. from the duplicate notice. */
  initialQuery: string;
}) {
  const text = useMessages(customerDirectoryMessageKey);
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setView] = useState<View>("grid");
  const [sort, setSort] = useState<SortKey>("name");

  const statusOptions: SegmentedOption<StatusFilter>[] = STATUS_FILTERS.map((id) => ({
    value: id,
    label: text.status[id],
  }));
  const viewOptions: SegmentedOption<View>[] = [
    { value: "grid", label: text.views.grid },
    { value: "table", label: text.views.table },
  ];
  const visible = visibleRows(customers, { query, status, sort, locale });
  const trimmedQuery = query.trim();

  function exportCsv() {
    downloadCsv(EXPORT_FILE, toCsv(visible, csvColumns(text.csv)));
  }

  return (
    <ReadState
      state={state}
      reason={reason}
      onRetry={() => router.refresh()}
      emptyTitle={text.empty.noContactsTitle}
      emptyDescription={text.empty.noContacts}
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
          <SegmentedControl label={text.statusLabel} value={status} options={statusOptions} onValueChange={setStatus} />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs">
                  <ListFilter data-icon="inline-start" />
                  {text.sort[sort]}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-44">
                <DropdownMenuLabel className="text-muted-foreground text-xs">{text.sort.label}</DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={sort}
                  onValueChange={(value) => {
                    if (isSortKey(value)) setSort(value);
                  }}
                >
                  {SORT_KEYS.map((key) => (
                    <DropdownMenuRadioItem key={key} value={key}>
                      {text.sort[key]}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <SegmentedControl label={text.views.label} value={view} options={viewOptions} onValueChange={setView} />
            <NewContactDialog errors={errors} />
            <Button
              variant="ghost"
              className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs"
              disabled={visible.length === 0}
              onClick={exportCsv}
            >
              <Download data-icon="inline-start" />
              {text.export}
            </Button>
          </div>
        </div>

        <ReadState
          state={{ status: visible.length === 0 ? "empty" : "ready" }}
          emptyTitle={text.empty.noMatchTitle}
          emptyDescription={
            trimmedQuery === "" ? text.empty.noMatchFilter : format(text.empty.noMatch, locale, { query: trimmedQuery })
          }
        >
          {/* Cards and rows open the customer panel with plan 003, C4; the star returns with it. */}
          {view === "grid" ? (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {visible.map((customer) => (
                <li key={customer.id}>
                  <CustomerCard customer={customer} />
                </li>
              ))}
            </ul>
          ) : (
            <CustomersTable customers={visible} />
          )}
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
