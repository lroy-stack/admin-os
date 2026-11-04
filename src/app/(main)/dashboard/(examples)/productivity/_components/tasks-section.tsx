"use client";

import { useState } from "react";

import { Calendar1, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatTime, useLocale, useMessages } from "@/core/i18n/client";

import { productivityMessageKey } from "./messages";
import { useProductivity } from "./productivity-provider";
import { inRange, type Task, type TaskRange, taskRanges } from "./productivity-state";

const isRange = (value: string): value is TaskRange => taskRanges.some((range) => range === value);

/** "10:00" as the locale writes a time of day, on a fixed reference day in UTC so it never shifts. */
function clock(time: string, locale: Parameters<typeof formatTime>[1]) {
  const [hour = "0", minute = "0"] = time.split(":");
  return formatTime(Date.UTC(2026, 0, 1, Number(hour), Number(minute)), locale, "UTC");
}

export function TasksSection() {
  const text = useMessages(productivityMessageKey).tasks;
  const locale = useLocale();
  const { state, setTaskDone, openCreate } = useProductivity();
  const [range, setRange] = useState<TaskRange>("today");
  const tasks = state.tasks.filter((task) => inRange(task.day, range));
  const titleOf = (task: Task) => (task.seed ? text.items[task.seed] : task.title);

  return (
    <section className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-xl tracking-tight">{text.title}</h2>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(value) => isRange(value) && setRange(value)}>
            <SelectTrigger className="min-w-30" aria-label={text.rangeLabel}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {taskRanges.map((value) => (
                  <SelectItem key={value} value={value}>
                    {text.ranges[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={(event) => openCreate("task", event.currentTarget)}>
            <Plus data-icon="inline-start" />
            {text.newTask}
          </Button>
        </div>
      </div>

      <div className="bg-background overflow-hidden rounded-xl border shadow-xs">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground p-6 text-center text-sm" role="status">
            {text.empty}
          </p>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-2 p-4">
                <Checkbox
                  checked={task.done}
                  aria-label={titleOf(task)}
                  onCheckedChange={(checked) => setTaskDone(task.id, checked === true)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                      <span className="line-clamp-2 min-w-0 text-sm break-words hyphens-auto" title={titleOf(task)}>
                        {titleOf(task)}
                      </span>
                      <Badge variant="outline" className="max-w-full shrink-0 px-3 py-1 font-normal">
                        <span className="truncate">{text.tags[task.tag]}</span>
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-sm tabular-nums">
                      <span>{clock(task.time, locale)}</span>
                      <Calendar1 className="size-4" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
