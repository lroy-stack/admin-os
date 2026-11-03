"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages } from "@/core/i18n/client";
import { askBeforeLeaving } from "@/ds/feedback";

import { shellMessageKey } from "./messages";
import { railButtonClassName } from "./rail-button";
import type { ShellSearchGroup, ShellSearchItem } from "./types";

type SearchItem = ShellSearchItem & { groupId: string; group: string };

function flatten(groups: readonly ShellSearchGroup[]): SearchItem[] {
  return groups.flatMap((group) => group.items.map((item) => ({ ...item, groupId: group.id, group: group.label })));
}

function groupBy(items: SearchItem[]) {
  const ids = [...new Set(items.map((item) => item.groupId))];
  return ids.map((groupId) => {
    const members = items.filter((item) => item.groupId === groupId);
    return { groupId, group: members[0]?.group, items: members };
  });
}

export function SearchDialog({ groups }: { groups: readonly ShellSearchGroup[] }) {
  const { search: text } = useMessages(shellMessageKey);
  const searchItems = flatten(groups);
  const recommendations = searchItems.filter((item) => item.suggested);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setQuery("");
  };

  const handleSelect = (item: SearchItem) => {
    if (item.disabled) return;
    handleOpenChange(false);
    if (item.newTab) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    } else {
      // Unsaved changes ask first; Leave pushes the same url.
      if (!askBeforeLeaving(() => router.push(item.url))) router.push(item.url);
    }
  };

  const renderGroups = (items: SearchItem[]) =>
    groupBy(items).map(({ groupId, group, items: groupItems }, index) => (
      <React.Fragment key={groupId}>
        {index > 0 && <CommandSeparator />}
        <CommandGroup heading={group}>
          {groupItems.map((item) => (
            <CommandItem
              disabled={item.disabled}
              key={`${groupId}-${item.id}`}
              value={`${item.group} ${item.label}`}
              onSelect={() => handleSelect(item)}
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.icon && <item.icon />}
                <span className="truncate">{item.label}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </React.Fragment>
    ));

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => handleOpenChange(true)} variant="ghost" size="icon" className={railButtonClassName}>
            <Search />
            <span className="sr-only">{text.open}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">{text.tooltip}</TooltipContent>
      </Tooltip>
      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput placeholder={text.placeholder} value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>{text.empty}</CommandEmpty>
            {query ? renderGroups(searchItems) : renderGroups(recommendations)}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
