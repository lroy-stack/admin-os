"use client";

import { useMemo } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { Boxes, Gauge, Hash, Package, Truck } from "lucide-react";

import { useLocale, useMessages } from "@/core/i18n/client";
import type { ViewData } from "@/core/views";
import { TonePill } from "@/ds/components";
import type { DataTableFeatures } from "@/ds/data-table";

import { InventoryList } from "./list";
import { inventoryViewsMessageKey } from "./messages";
import type { StockRow } from "./model";
import { onHandText } from "./units";

const HEADER_ICONS = { name: Package, sku: Hash, onHand: Boxes, level: Gauge, supplier: Truck };

/** The `inventory.stock` renderer (ADR 0018 §3): what the business keeps, and what is at or under its reorder point. */
export function StockView({ data }: { data: ViewData<StockRow> }) {
  const text = useMessages(inventoryViewsMessageKey).stock;
  const locale = useLocale();

  const columns = useMemo<ColumnDef<DataTableFeatures, StockRow>[]>(
    () => [
      {
        id: "search",
        accessorFn: (item) => `${item.name} ${item.sku} ${item.supplierName ?? ""}`,
        filterFn: "includesString",
        enableSorting: false,
      },
      {
        accessorKey: "name",
        header: text.columns.item,
        cell: ({ row }) => (
          <span className="line-clamp-2 block max-w-72 break-words hyphens-auto">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "sku",
        header: text.columns.sku,
        cell: ({ row }) => <span className="text-muted-foreground font-mono text-xs">{row.original.sku}</span>,
      },
      {
        accessorKey: "onHand",
        header: text.columns.onHand,
        cell: ({ row }) => (
          <span className="tabular-nums">{onHandText(text, locale, row.original.onHand, row.original.unit)}</span>
        ),
      },
      {
        id: "level",
        accessorFn: (item) => (item.belowReorder ? "below" : "ok"),
        header: text.columns.level,
        filterFn: "equalsString",
        cell: ({ row }) => (
          <TonePill tone={row.original.belowReorder ? "salmon" : "neutral"}>
            {row.original.belowReorder ? text.level.below : text.level.ok}
          </TonePill>
        ),
      },
      {
        id: "supplier",
        accessorFn: (item) => item.supplierName ?? "",
        header: text.columns.supplier,
        cell: ({ row }) => row.original.supplierName ?? text.noSupplier,
      },
    ],
    [text, locale],
  );

  return (
    <InventoryList
      data={data}
      columns={columns}
      text={text}
      headerIcons={HEADER_ICONS}
      filter={{
        columnId: "level",
        label: text.filters.levelLabel,
        all: text.filters.allLevels,
        options: [
          { value: "below", label: text.level.below },
          { value: "ok", label: text.level.ok },
        ],
      }}
      pageSizeId="stock-page-size"
    />
  );
}
