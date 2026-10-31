"use client";

import * as React from "react";

import { Calendar1 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface ChecklistItem {
  readonly key: string;
  readonly title: string;
  readonly tag: string;
  readonly time: string;
  readonly checked: boolean;
}

/** The only interactive part of the tasks section: every string arrives resolved from the server. */
export function TaskChecklist({ items: initialItems }: { items: readonly ChecklistItem[] }) {
  const [items, setItems] = React.useState(initialItems);

  return (
    <div className="bg-background overflow-hidden rounded-xl border shadow-xs">
      <div className="divide-y">
        {items.map((task) => (
          <div key={task.key} className="flex items-center gap-2 p-4">
            <Checkbox
              checked={task.checked}
              aria-label={task.title}
              onCheckedChange={(checked) => {
                setItems((current) =>
                  current.map((item) => (item.key === task.key ? { ...item, checked: checked === true } : item)),
                );
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                  <span className="line-clamp-2 min-w-0 text-sm break-words hyphens-auto" title={task.title}>
                    {task.title}
                  </span>
                  <Badge variant="outline" className="max-w-full shrink-0 px-3 py-1 font-normal">
                    <span className="truncate">{task.tag}</span>
                  </Badge>
                </div>
                <div className="text-muted-foreground flex shrink-0 items-center gap-3 text-sm tabular-nums">
                  <span>{task.time}</span>
                  <Calendar1 className="size-4" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
