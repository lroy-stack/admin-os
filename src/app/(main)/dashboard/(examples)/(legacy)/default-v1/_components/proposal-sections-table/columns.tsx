"use client";

import { createContext, useContext } from "react";

import { RestrictToVerticalAxis } from "@dnd-kit/abstract/modifiers";
import { useSortable } from "@dnd-kit/react/sortable";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { FlexRender, Subscribe } from "@tanstack/react-table";
import { CircleCheckIcon, EllipsisVerticalIcon, GripVerticalIcon, LoaderIcon, TrendingUpIcon } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  format,
  formatCalendarDate,
  type Locale,
  useChartFormatters,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import type { DataTableFeatures } from "@/ds/data-table";
import { useIsMobile } from "@/hooks/use-mobile";

import { type DefaultV1Messages, defaultV1MessageKey } from "../messages";
import { formatOneDecimalPercent } from "../percent";
import { VisitorsTooltip } from "../visitors-tooltip";
import { type ProposalSectionsRow, sectionStatuses, sectionTypes } from "./schema";

// Calendar months of the drawer's demo chart; the names come from `Intl` in the active locale.
const chartData = [
  { month: "2024-01", desktop: 186, mobile: 80 },
  { month: "2024-02", desktop: 305, mobile: 200 },
  { month: "2024-03", desktop: 237, mobile: 120 },
  { month: "2024-04", desktop: 73, mobile: 190 },
  { month: "2024-05", desktop: 209, mobile: 130 },
  { month: "2024-06", desktop: 214, mobile: 140 },
];

const CHART_MONTHS = chartData.length;

// Proper nouns: the people who can review a section.
const reviewers = ["Eddie Lake", "Jamik Tashpulatov", "Emily Whalen"] as const;

type SortableRowContextValue = Pick<ReturnType<typeof useSortable>, "handleRef">;

const SortableRowContext = createContext<SortableRowContextValue | null>(null);

function DragHandle() {
  const text = useMessages(defaultV1MessageKey).table;
  const sortableRow = useContext(SortableRowContext);

  if (!sortableRow) {
    return null;
  }

  const { handleRef } = sortableRow;

  return (
    <Button ref={handleRef} variant="ghost" size="icon" className="text-muted-foreground size-7 hover:bg-transparent">
      <GripVerticalIcon />
      <span className="sr-only">{text.dragToReorder}</span>
    </Button>
  );
}

function ProposalSectionDetailViewer({ item }: { item: ProposalSectionsRow }) {
  const messages = useMessages(defaultV1MessageKey);
  const text = messages.table;
  const locale = useLocale();
  const fmt = useChartFormatters();
  const isMobile = useIsMobile();
  const chartConfig = {
    desktop: { label: messages.chart.series.desktop, color: "var(--primary)" },
    mobile: { label: messages.chart.series.mobile, color: "var(--primary)" },
  } satisfies ChartConfig;

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button
          variant="link"
          className="text-foreground h-auto w-fit max-w-64 px-0 py-0 text-left break-words hyphens-auto whitespace-normal"
        >
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>{format(text.drawer.description, locale, { count: CHART_MONTHS })}</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => fmt.month(String(value))}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <VisitorsTooltip
                        seriesLabels={{ desktop: chartConfig.desktop.label, mobile: chartConfig.mobile.label }}
                        labelFormatter={(value) => formatCalendarDate(`${value}-01`, locale, { month: "long" })}
                        indicator="dot"
                      />
                    }
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  {format(text.drawer.trend, locale, { change: formatOneDecimalPercent(0.052, locale) })}{" "}
                  <TrendingUpIcon />
                </div>
                <div className="text-muted-foreground">
                  {format(text.drawer.summary, locale, { count: CHART_MONTHS })}
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">{text.drawer.fields.header}</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">{text.drawer.fields.type}</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder={text.drawer.selectType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sectionTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {text.types[type]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">{text.drawer.fields.status}</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder={text.drawer.selectStatus} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {sectionStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {text.statuses[status]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">{text.drawer.fields.target}</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">{text.drawer.fields.limit}</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">{text.drawer.fields.reviewer}</Label>
              <Select defaultValue={item.reviewer ?? undefined}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder={text.drawer.selectReviewer} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {reviewers.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>{text.drawer.save}</Button>
          <DrawerClose asChild>
            <Button variant="outline">{text.drawer.close}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function createInlineSaveHandler(header: string, text: DefaultV1Messages["table"], locale: Locale) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
      loading: format(text.toast.saving, locale, { header }),
      success: text.toast.saved,
      error: text.toast.error,
    });
  };
}

export function createProposalSectionsColumns(
  text: DefaultV1Messages["table"],
  locale: Locale,
): ColumnDef<DataTableFeatures, ProposalSectionsRow>[] {
  return [
    {
      id: "drag",
      header: () => null,
      cell: () => <DragHandle />,
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Subscribe
            source={table.atoms.rowSelection}
            selector={() =>
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() && "indeterminate")
            }
          >
            {(checked) => (
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label={text.selectAll}
              />
            )}
          </Subscribe>
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Subscribe source={row.table.atoms.rowSelection} selector={(rowSelection) => Boolean(rowSelection?.[row.id])}>
            {(checked) => (
              <Checkbox
                checked={checked}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label={text.selectRow}
              />
            )}
          </Subscribe>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "header",
      header: text.columns.header,
      cell: ({ row }) => <ProposalSectionDetailViewer item={row.original} />,
      enableHiding: false,
    },
    {
      accessorKey: "type",
      header: text.columns.type,
      cell: ({ row }) => (
        <div className="min-w-32">
          <Badge variant="outline" className="text-muted-foreground px-1.5">
            {text.types[row.original.type]}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: text.columns.status,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.status === "done" ? (
            <CircleCheckIcon className="stroke-primary-foreground fill-green-500 dark:fill-green-600" />
          ) : (
            <LoaderIcon />
          )}
          {text.statuses[row.original.status]}
        </Badge>
      ),
    },
    {
      accessorKey: "target",
      header: () => <div className="w-full text-right">{text.columns.target}</div>,
      cell: ({ row }) => (
        <form onSubmit={createInlineSaveHandler(row.original.header, text, locale)}>
          <Label htmlFor={`${row.original.id}-target`} className="sr-only">
            {text.columns.target}
          </Label>
          <Input
            id={`${row.original.id}-target`}
            defaultValue={row.original.target}
            className="hover:bg-input/30 focus-visible:bg-background dark:focus-visible:bg-input/30 dark:hover:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          />
        </form>
      ),
    },
    {
      accessorKey: "limit",
      header: () => <div className="w-full text-right">{text.columns.limit}</div>,
      cell: ({ row }) => (
        <form onSubmit={createInlineSaveHandler(row.original.header, text, locale)}>
          <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
            {text.columns.limit}
          </Label>
          <Input
            id={`${row.original.id}-limit`}
            defaultValue={row.original.limit}
            className="hover:bg-input/30 focus-visible:bg-background dark:focus-visible:bg-input/30 dark:hover:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          />
        </form>
      ),
    },
    {
      accessorKey: "reviewer",
      header: text.columns.reviewer,
      cell: ({ row }) => {
        if (row.original.reviewer !== null) {
          return row.original.reviewer;
        }

        return (
          <>
            <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
              {text.columns.reviewer}
            </Label>
            <Select>
              <SelectTrigger
                id={`${row.original.id}-reviewer`}
                className="w-44 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
                size="sm"
              >
                <SelectValue placeholder={text.assignReviewer} />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectGroup>
                  {reviewers.slice(0, 2).map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </>
        );
      },
    },
    {
      id: "actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground data-[state=open]:bg-muted flex size-8"
              size="icon"
            >
              <EllipsisVerticalIcon />
              <span className="sr-only">{text.openMenu}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuItem>{text.actions.edit}</DropdownMenuItem>
            <DropdownMenuItem>{text.actions.copy}</DropdownMenuItem>
            <DropdownMenuItem>{text.actions.favorite}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">{text.actions.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
    },
  ];
}

export function DraggableProposalSectionsRow({
  row,
  index,
  isSelected,
}: {
  row: Row<DataTableFeatures, ProposalSectionsRow>;
  index: number;
  isSelected: boolean;
}) {
  const { handleRef, isDragging, ref } = useSortable({
    id: row.original.id,
    index,
    type: "proposal-section",
    accept: "proposal-section",
    group: "proposal-sections",
    modifiers: [RestrictToVerticalAxis],
  });

  return (
    <SortableRowContext.Provider value={{ handleRef }}>
      <TableRow
        ref={ref}
        data-state={isSelected && "selected"}
        data-dragging={isDragging}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            <FlexRender cell={cell} />
          </TableCell>
        ))}
      </TableRow>
    </SortableRowContext.Provider>
  );
}
