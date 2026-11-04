"use client";

import { useId } from "react";

import { ArrowUpDown, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import { activeFilterCount, NO_FILTERS, type TaskFilters, type TaskSort, taskSorts } from "./board-view";
import { taskOwnerProfiles, taskPriorities, taskTeams } from "./data";
import { kanbanMessageKey } from "./messages";
import type { TaskPriority, TaskTeam } from "./types";

function isSort(value: string): value is TaskSort {
  return taskSorts.some((sort) => sort === value);
}

/** Filter: owner, team, priority and due day, in a popover from 768 px and a bottom sheet below (ADR 0015). */
export function FilterPopover({
  filters,
  onChange,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
}) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const ids = { owner: useId(), team: useId(), priority: useId(), due: useId() };
  const active = activeFilterCount(filters);
  const copy = text.filter;

  return (
    <PopoverOrSheet
      title={copy.title}
      description={copy.description}
      className="w-80"
      trigger={
        <Button variant="outline" className="w-full sm:w-auto">
          <SlidersHorizontal data-icon="inline-start" />
          {active > 0 ? format(text.toolbar.filterActive, locale, { count: active }) : text.toolbar.filter}
        </Button>
      }
    >
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.owner}>{copy.owner}</Label>
          <NativeSelect
            id={ids.owner}
            value={filters.owner}
            onChange={(event) => onChange({ ...filters, owner: event.target.value })}
            className="w-full"
          >
            <NativeSelectOption value="">{copy.any}</NativeSelectOption>
            {taskOwnerProfiles.map((owner) => (
              <NativeSelectOption key={owner.name} value={owner.name}>
                {owner.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.team}>{copy.team}</Label>
          <NativeSelect
            id={ids.team}
            value={filters.team}
            onChange={(event) => onChange({ ...filters, team: event.target.value as TaskTeam | "" })}
            className="w-full"
          >
            <NativeSelectOption value="">{copy.any}</NativeSelectOption>
            {taskTeams.map((team) => (
              <NativeSelectOption key={team} value={team}>
                {text.teams[team]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.priority}>{copy.priority}</Label>
          <NativeSelect
            id={ids.priority}
            value={filters.priority}
            onChange={(event) => onChange({ ...filters, priority: event.target.value as TaskPriority | "" })}
            className="w-full"
          >
            <NativeSelectOption value="">{copy.any}</NativeSelectOption>
            {taskPriorities.map((priority) => (
              <NativeSelectOption key={priority} value={priority}>
                {text.priorities[priority]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={ids.due}>{copy.dueBefore}</Label>
          <Input
            id={ids.due}
            type="date"
            value={filters.dueBefore}
            onChange={(event) => onChange({ ...filters, dueBefore: event.target.value })}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={active === 0}
          onClick={() => onChange({ ...NO_FILTERS, query: filters.query })}
        >
          {copy.clear}
        </Button>
      </div>
    </PopoverOrSheet>
  );
}

/** Sort: a menu of one choice among board order, due date, priority and title. */
export function SortMenu({ sort, onChange }: { sort: TaskSort; onChange: (sort: TaskSort) => void }) {
  const text = useMessages(kanbanMessageKey);
  const labels: Record<TaskSort, string> = {
    manual: text.sort.manual,
    due: text.sort.due,
    priority: text.sort.priority,
    title: text.sort.name,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <ArrowUpDown data-icon="inline-start" />
          {text.toolbar.sort}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{text.sort.title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sort}
          onValueChange={(value) => {
            if (isSort(value)) onChange(value);
          }}
        >
          {taskSorts.map((value) => (
            <DropdownMenuRadioItem key={value} value={value}>
              {labels[value]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
