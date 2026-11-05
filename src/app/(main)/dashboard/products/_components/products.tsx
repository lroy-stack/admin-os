"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { useTable } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocale, useMessages } from "@/core/i18n/client";
import { SegmentedControl, type SegmentedOption } from "@/ds/components";
import { dataTableFeatures } from "@/ds/data-table";
import { ReadState } from "@/ds/feedback";

import { productsMessageKey } from "./messages";
import { createProductsColumns } from "./products-columns";
import { PRODUCT_STATUSES, type ProductViewData } from "./products-model";
import { ProductsTable } from "./products-table";

/** The views the viewer may read, in the preset's order; with one, there is no toggle and that view is shown. */
export function Products({ views }: { views: readonly ProductViewData[] }) {
  const text = useMessages(productsMessageKey);
  const locale = useLocale();
  const router = useRouter();
  const [viewId, setViewId] = useState(views[0]?.id ?? "");
  const view = views.find((item) => item.id === viewId) ?? views[0];

  const columns = useMemo(() => createProductsColumns({ text, locale }), [text, locale]);
  const viewOptions: SegmentedOption<string>[] = views.map((item) => ({ value: item.id, label: item.label }));

  const table = useTable({
    features: dataTableFeatures,
    data: view?.rows ?? [],
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

  function showView(id: string) {
    setViewId(id);
    resetFilters();
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          {views.length > 1 && (
            <SegmentedControl
              label={text.viewsLabel}
              value={view?.id ?? ""}
              options={viewOptions}
              onValueChange={showView}
            />
          )}
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
        state={view?.state ?? { status: "empty" }}
        reason={view?.reason}
        onRetry={() => router.refresh()}
        emptyTitle={text.empty.title}
        emptyDescription={text.empty.description}
      >
        <ProductsTable table={table} onReset={resetFilters} />
      </ReadState>
    </div>
  );
}
