"use client";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatCalendarDate, formatNumber, type Locale } from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";

import type { RolesMessages } from "../messages";
import type { Role, RoleOwner } from "./data";

/** The owner as people read it: the built-in owner is translated, a person keeps their name. */
export function ownerName(owner: RoleOwner, text: RolesMessages) {
  return owner === "system" ? text.systemOwner : owner;
}

/** Columns written in one locale; the table is rebuilt when the language changes. */
export function createRolesColumns(text: RolesMessages, locale: Locale): ColumnDef<DataTableFeatures, Role>[] {
  return [
    {
      id: "group",
      accessorKey: "group",
      filterFn: "equalsString",
      enableHiding: true,
    },
    {
      id: "search",
      accessorFn: (row) =>
        [
          text.roleNames[row.id],
          ownerName(row.owner, text),
          ...row.permissionSets.map((set) => text.permissionSets[set]),
        ].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      id: "role",
      accessorKey: "id",
      header: text.columns.role,
      size: 180,
      minSize: 180,
      cell: ({ row }) => <span className="text-sm font-medium break-words">{text.roleNames[row.original.id]}</span>,
    },
    {
      id: "accessLevel",
      accessorKey: "accessLevel",
      header: text.columns.accessLevel,
      size: 140,
      cell: ({ row }) => (
        <Badge className="h-auto max-w-full rounded-sm py-0.5 whitespace-normal" variant="outline">
          {text.accessLevels[row.original.accessLevel]}
        </Badge>
      ),
    },
    {
      id: "users",
      accessorKey: "users",
      header: text.columns.users,
      size: 90,
      cell: ({ row }) => <span className="text-sm tabular-nums">{formatNumber(row.original.users, locale)}</span>,
    },
    {
      id: "permissionSets",
      accessorFn: (row) => row.permissionSets.join(" "),
      header: text.columns.permissionSets,
      size: 330,
      cell: ({ row }) => (
        <div className="flex flex-wrap items-center justify-start gap-2">
          {row.original.permissionSets.slice(0, 3).map((set) => (
            <Badge className="h-auto max-w-full rounded-sm py-0.5 whitespace-normal" variant="outline" key={set}>
              {text.permissionSets[set]}
            </Badge>
          ))}
          {row.original.permissionSets.length > 3 ? (
            <span className="shrink-0 text-sm tabular-nums">
              {`+${formatNumber(row.original.permissionSets.length - 3, locale)}`}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      id: "lastReview",
      accessorKey: "lastReview",
      header: text.columns.lastReview,
      size: 140,
      cell: ({ row }) => (
        <span className="text-sm">{formatCalendarDate(row.original.lastReview, locale, { dateStyle: "medium" })}</span>
      ),
    },
    {
      id: "owner",
      accessorKey: "owner",
      header: text.columns.owner,
      size: 130,
      filterFn: "equalsString",
      cell: ({ row }) => <span className="text-sm break-words">{ownerName(row.original.owner, text)}</span>,
    },
    {
      id: "status",
      accessorKey: "status",
      header: text.columns.status,
      size: 150,
      filterFn: "equalsString",
      cell: ({ row }) => (
        <Badge className="h-auto max-w-full rounded-sm py-0.5 whitespace-normal" variant="outline">
          {row.original.status === "active" ? text.filters.active : text.filters.needsReview}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      size: 70,
      cell: ({ row }) => {
        const isSystemRole = row.original.group === "system";
        const needsReview = row.original.status === "needsReview";
        const roleName = text.roleNames[row.original.id];

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={format(text.rowMenu.label, locale, { role: roleName })}
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                {needsReview ? <DropdownMenuItem>{text.rowMenu.reviewChanges}</DropdownMenuItem> : null}
                <DropdownMenuItem>{text.rowMenu.viewDetails}</DropdownMenuItem>
                <DropdownMenuItem disabled={isSystemRole}>{text.rowMenu.editRole}</DropdownMenuItem>
                <DropdownMenuItem disabled={isSystemRole}>{text.rowMenu.duplicateRole}</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>{text.rowMenu.reviewPermissions}</DropdownMenuItem>
                <DropdownMenuItem>{text.rowMenu.manageMembers}</DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled={isSystemRole} variant="destructive">
                  {text.rowMenu.archiveRole}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableColumnFilter: false,
    },
  ];
}
