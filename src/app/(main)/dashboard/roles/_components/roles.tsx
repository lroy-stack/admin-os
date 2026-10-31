"use client";
import { useMemo, useState } from "react";

import { type ColumnFiltersState, type PaginationState, useTable } from "@tanstack/react-table";
import { AlertTriangle, ChevronRight, FileUp, Search } from "lucide-react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { dataTableFeatures } from "@/ds/data-table";

import { rolesMessageKey } from "./messages";
import { createRolesColumns, ownerName } from "./roles-table/columns";
import { type Role, roleOwners } from "./roles-table/data";
import { RolesTable } from "./roles-table/table";

type TypeFilter = "all" | "system" | "custom";

function getRoleTypeFilter(groupFilter: string): TypeFilter {
  return groupFilter === "system" || groupFilter === "custom" ? groupFilter : "all";
}

export function Roles({ roles }: { roles: Role[] }) {
  const text = useMessages(rolesMessageKey);
  const locale = useLocale();
  const columns = useMemo(() => createRolesColumns(text, locale), [text, locale]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  const table = useTable({
    features: dataTableFeatures,
    data: roles,
    columns,
    defaultColumn: {
      size: 140,
      minSize: 80,
      maxSize: 420,
    },
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,
    initialState: {
      columnVisibility: { group: false, search: false },
    },
  });

  const search = (table.getColumn("search")?.getFilterValue() as string | undefined) ?? "";
  const groupFilter = (table.getColumn("group")?.getFilterValue() as string | undefined) ?? "";
  const typeFilter = getRoleTypeFilter(groupFilter);
  const ownerFilter = (table.getColumn("owner")?.getFilterValue() as string | undefined) ?? "all";
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string | undefined) ?? "all";
  const reviewCount = roles.filter((role) => role.status === "needsReview").length;

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl tracking-tight break-words hyphens-auto">{text.title}</h1>
          <p className="text-muted-foreground text-sm">{text.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline">
            <FileUp data-icon="inline-start" />
            {text.actions.importJson}
          </Button>
          <Button size="sm">{text.actions.createRole}</Button>
        </div>
      </div>

      <Tabs className="h-full gap-4" defaultValue="roles">
        <TabsList
          variant="line"
          className="w-full justify-start gap-2 border-b ps-0 *:data-[slot=tabs-trigger]:flex-none"
        >
          <TabsTrigger value="roles">{text.tabs.roles}</TabsTrigger>
          <TabsTrigger value="permission-sets">{text.tabs.permissionSets}</TabsTrigger>
          <TabsTrigger value="access-reviews">{text.tabs.accessReviews}</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <div className="flex flex-col gap-4">
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
              <AlertTriangle className="size-4" />
              <AlertTitle>{text.review.title}</AlertTitle>
              <AlertDescription>{format(text.review.description, locale, { count: reviewCount })}</AlertDescription>
              <AlertAction>
                <Button size="sm" variant="link">
                  {text.review.action}
                  <ChevronRight data-icon="inline-end" />
                </Button>
              </AlertAction>
            </Alert>

            <div className="border-border/70 bg-background overflow-hidden rounded-xl border">
              <div className="flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <InputGroup className="h-7 w-full rounded-md sm:w-82">
                  <InputGroupAddon>
                    <Search />
                  </InputGroupAddon>
                  <InputGroupInput
                    className="h-7"
                    aria-label={text.search.label}
                    placeholder={text.search.placeholder}
                    value={search}
                    onChange={(e) => {
                      table.getColumn("search")?.setFilterValue(e.target.value || undefined);
                      table.setPageIndex(0);
                    }}
                  />
                </InputGroup>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={typeFilter}
                    onValueChange={(v) => {
                      table.getColumn("group")?.setFilterValue(v === "all" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">{text.filters.type}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="all">{text.filters.all}</SelectItem>
                        <SelectItem value="system">{text.filters.system}</SelectItem>
                        <SelectItem value="custom">{text.filters.custom}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={ownerFilter}
                    onValueChange={(v) => {
                      table.getColumn("owner")?.setFilterValue(v === "all" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">{text.filters.owner}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="all">{text.filters.all}</SelectItem>
                        {roleOwners.map((owner) => (
                          <SelectItem key={owner} value={owner}>
                            {ownerName(owner, text)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      table.getColumn("status")?.setFilterValue(v === "all" ? undefined : v);
                      table.setPageIndex(0);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="text-muted-foreground">{text.filters.status}</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="start">
                      <SelectGroup>
                        <SelectItem value="all">{text.filters.all}</SelectItem>
                        <SelectItem value="active">{text.filters.active}</SelectItem>
                        <SelectItem value="needsReview">{text.filters.needsReview}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <RolesTable table={table} />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="permission-sets">
          <div className="text-muted-foreground flex h-full items-center justify-center rounded-md border border-dashed text-sm">
            {text.comingSoon.permissionSets}
          </div>
        </TabsContent>
        <TabsContent value="access-reviews">
          <div className="text-muted-foreground flex h-full items-center justify-center rounded-md border border-dashed text-sm">
            {text.comingSoon.accessReviews}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
