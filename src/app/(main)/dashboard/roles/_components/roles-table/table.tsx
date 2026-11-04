"use client";
import { useMemo } from "react";

import { FlexRender, type ReactTable } from "@tanstack/react-table";
import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import { rolesMessageKey } from "../messages";
import type { Role, RoleGroup } from "./data";

type RoleTableRow = ReturnType<ReactTable<DataTableFeatures, Role>["getRowModel"]>["rows"][number];

function groupRowsByRoleGroup(rows: RoleTableRow[]) {
  return rows.reduce(
    (groups, row) => {
      const label = row.original.group;
      const group = groups.find((item) => item.label === label);

      if (group) {
        group.rows.push(row);
      } else {
        groups.push({ label, rows: [row] });
      }

      return groups;
    },
    [] as Array<{ label: RoleGroup; rows: RoleTableRow[] }>,
  );
}

export function RolesTable({ table }: { table: ReactTable<DataTableFeatures, Role> }) {
  const text = useMessages(rolesMessageKey);
  const locale = useLocale();
  const { pageIndex, pageSize } = table.state.pagination;
  const pageRows = table.getRowModel().rows;
  const filteredRows = table.getFilteredRowModel().rows;

  const groupedRows = useMemo(() => groupRowsByRoleGroup(pageRows), [pageRows]);
  const filteredGroups = useMemo(() => groupRowsByRoleGroup(filteredRows), [filteredRows]);
  const totalGroupCounts = useMemo(
    () => new Map(filteredGroups.map((group) => [group.label, group.rows.length])),
    [filteredGroups],
  );

  const start = filteredRows.length === 0 ? 0 : pageIndex * pageSize + 1;
  const end = filteredRows.length === 0 ? 0 : start + pageRows.length - 1;
  const colCount = table.getVisibleLeafColumns().length;

  return (
    <>
      <Table className="w-full table-fixed border-collapse" style={{ minWidth: table.getTotalSize() }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-y hover:bg-transparent [&>:not(:last-child)]:border-r">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() }}
                  className="text-foreground h-10 px-4 text-center text-sm font-medium first:text-left"
                >
                  {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groupedRows.length ? (
            groupedRows.map((group) => (
              <TableBodyGroup
                key={group.label}
                group={group}
                totalCount={totalGroupCounts.get(group.label) ?? 0}
                colCount={colCount}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={colCount} className="text-muted-foreground h-24 text-center">
                {text.table.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="border-border/70 flex flex-wrap items-center gap-x-4 gap-y-3 border-t p-4">
        <div className="text-muted-foreground min-w-0 text-sm">
          {format(text.table.showing, locale, {
            count: filteredRows.length,
            start,
            end,
            total: filteredRows.length,
          })}
        </div>

        <div className="mx-auto">
          <Pagination className="mx-0 w-auto justify-center" aria-label={text.table.paginationLabel}>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  size="sm"
                  href="#"
                  text=""
                  aria-label={text.table.previousPage}
                  className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    table.previousPage();
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink
                  size="sm"
                  href="#"
                  isActive
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(pageIndex);
                  }}
                >
                  {formatNumber(pageIndex + 1, locale)}
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  size="sm"
                  href="#"
                  text=""
                  aria-label={text.table.nextPage}
                  className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    table.nextPage();
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{text.table.rowsPerPage}</span>
          <Select
            value={`${pageSize}`}
            onValueChange={(v) => {
              table.setPageSize(Number(v));
            }}
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" side="top">
              <SelectGroup>
                <SelectItem value="12">{formatNumber(12, locale)}</SelectItem>
                <SelectItem value="24">{formatNumber(24, locale)}</SelectItem>
                <SelectItem value="48">{formatNumber(48, locale)}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
}

function TableBodyGroup({
  group,
  totalCount,
  colCount,
}: {
  group: { label: RoleGroup; rows: RoleTableRow[] };
  totalCount: number;
  colCount: number;
}) {
  const text = useMessages(rolesMessageKey);
  const locale = useLocale();
  return (
    <>
      <TableRow className="bg-muted h-10">
        <TableCell className="text-foreground/60 px-4 text-sm" colSpan={colCount}>
          {text.groups[group.label]}{" "}
          <Badge variant="outline" className="text-muted-foreground ml-2 rounded-sm bg-transparent text-xs">
            {format(text.table.groupCount, locale, {
              shown: group.rows.length,
              total: totalCount,
            })}
          </Badge>
        </TableCell>
      </TableRow>
      {group.rows.map((row) => (
        <TableRow key={row.id} className="hover:bg-muted/20 h-12">
          {row.getVisibleCells().map((cell, index) => (
            <TableCell
              key={cell.id}
              style={{ width: cell.column.getSize() }}
              className={cn(
                "border-r px-4 align-middle",
                index === row.getVisibleCells().length - 1 && "border-r-0",
                index === 0 ? "text-left" : "text-center",
              )}
            >
              <FlexRender cell={cell} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
