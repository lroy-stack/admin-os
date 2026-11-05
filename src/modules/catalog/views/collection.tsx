"use client";

import { useMemo } from "react";

import { useRouter } from "next/navigation";

import { useTable } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale, useMessages } from "@/core/i18n/client";
import type { ViewData } from "@/core/views";
import { dataTableFeatures } from "@/ds/data-table";
import { ReadState } from "@/ds/feedback";

import { createProductsColumns } from "./columns";
import { catalogCollectionMessageKey } from "./messages";
import { PRODUCT_STATUSES, type ProductRow } from "./model";
import { ProductsTable } from "./table";

/** The `catalog.collection` renderer (ADR 0018 §3): the items of one view, with search, a status filter and pages. */
export function CatalogCollection({ data }: { data: ViewData<ProductRow> }) {
  const text = useMessages(catalogCollectionMessageKey);
  const locale = useLocale();
  const router = useRouter();

  const columns = useMemo(() => createProductsColumns({ text, locale }), [text, locale]);

  const table = useTable({
    features: dataTableFeatures,
    data: data.rows,
    columns,
    initialState: {
      columnVisibility: { search: false },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
    enableSorting: false,
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const status = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all";

  function filterColumn(id: string, value: string) {
    table.getColumn(id)?.setFilterValue(!value || (id !== "search" && value === "all") ? undefined : value);
    table.setPageIndex(0);
  }

  function resetFilters() {
    table.resetColumnFilters();
    table.setPageIndex(0);
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="h-7 w-full rounded-[min(var(--radius-md),10px)] sm:w-64">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              type="text"
              aria-label={text.search.label}
              placeholder={text.search.placeholder}
              value={search}
              onChange={(event) => filterColumn("search", event.target.value)}
            />
          </InputGroup>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(search || status !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {text.clearFilters}
            </Button>
          )}
          <Select value={status} onValueChange={(value) => filterColumn("status", value)}>
            <SelectTrigger size="sm" aria-label={text.filters.statusLabel} className="min-w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                <SelectItem value="all">{text.filters.allStatuses}</SelectItem>
                {PRODUCT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {text.statuses[item]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ReadState
        state={data.state}
        reason={data.reason}
        onRetry={() => router.refresh()}
        emptyTitle={text.empty.title}
        emptyDescription={text.empty.description}
      >
        <ProductsTable table={table} onReset={resetFilters} />
      </ReadState>
    </div>
  );
}
