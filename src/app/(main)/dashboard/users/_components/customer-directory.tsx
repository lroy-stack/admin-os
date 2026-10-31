"use client";

import { useState } from "react";

import { Download, ListFilter, Plus, SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { Segment } from "@/data/crm";
import { SearchCapsule, SegmentedControl, type SegmentedOption } from "@/ds/components";

import { CustomerCard } from "./customer-card";
import type { CustomerRow } from "./customers-data";
import { CustomersTable } from "./customers-table";

type SegmentFilter = "all" | Segment;
type View = "grid" | "table";
type SortKey = "lastContact" | "openPipeline" | "score" | "name";

const segmentOptions: SegmentedOption<SegmentFilter>[] = [
  { value: "all", label: "All" },
  { value: "Enterprise", label: "Enterprise" },
  { value: "Mid-market", label: "Mid-market" },
  { value: "SMB", label: "SMB" },
];

const viewOptions: SegmentedOption<View>[] = [
  { value: "grid", label: "Grid" },
  { value: "table", label: "Table" },
];

const sortLabels: Record<SortKey, string> = {
  lastContact: "Last contacted",
  openPipeline: "Open pipeline",
  score: "Score",
  name: "Name",
};

const comparators: Record<SortKey, (a: CustomerRow, b: CustomerRow) => number> = {
  lastContact: (a, b) => b.lastContact.localeCompare(a.lastContact),
  openPipeline: (a, b) => b.openPipeline - a.openPipeline,
  score: (a, b) => b.score - a.score,
  name: (a, b) => a.name.localeCompare(b.name),
};

function isSortKey(value: string): value is SortKey {
  return value in sortLabels;
}

export function CustomerDirectory({ customers }: { customers: CustomerRow[] }) {
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<SegmentFilter>("all");
  const [view, setView] = useState<View>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("lastContact");
  const [starred, setStarred] = useState<ReadonlySet<string>>(
    () => new Set(customers.filter((customer) => customer.starred).map((customer) => customer.id)),
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visible = customers
    .filter((customer) => segment === "all" || customer.segment === segment)
    .filter((customer) =>
      `${customer.name} ${customer.company} ${customer.title}`.toLowerCase().includes(normalizedQuery),
    )
    .sort(comparators[sortKey]);

  function toggleStar(id: string) {
    setStarred((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <SearchCapsule
          label="Search customers"
          placeholder="Search name, company, role..."
          value={query}
          onValueChange={setQuery}
          className="sm:w-72"
        />
        <SegmentedControl label="Segment" value={segment} options={segmentOptions} onValueChange={setSegment} />
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs">
                <ListFilter data-icon="inline-start" />
                {sortLabels[sortKey]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuLabel className="text-muted-foreground text-xs">Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortKey}
                onValueChange={(value) => {
                  if (isSortKey(value)) setSortKey(value);
                }}
              >
                {Object.entries(sortLabels).map(([key, label]) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <SegmentedControl label="Directory view" value={view} options={viewOptions} onValueChange={setView} />
          <Button variant="ghost" className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs">
            <Download data-icon="inline-start" />
            Export
          </Button>
        </div>
      </div>

      <Button className="liquid-glass-brand h-9 w-fit rounded-full px-4">
        <Plus data-icon="inline-start" />
        New customer
      </Button>

      {visible.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No customers found</EmptyTitle>
            <EmptyDescription>
              {normalizedQuery
                ? `Nothing matches “${query.trim()}” in this segment.`
                : "There are no customers in this segment yet."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {visible.length > 0 && view === "grid" && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((customer) => (
            <li key={customer.id}>
              <CustomerCard
                customer={customer}
                starred={starred.has(customer.id)}
                onToggleStar={() => toggleStar(customer.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {visible.length > 0 && view === "table" && <CustomersTable customers={visible} starred={starred} />}
    </div>
  );
}
