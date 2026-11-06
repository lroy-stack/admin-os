"use client";

import { useRef } from "react";

import { CircleOff, Ellipsis, MoveRight, Pencil, Trash2, Trophy } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { CardIconButton } from "@/ds/components";
import { type OpenDeal, openStages } from "@/lib/crm";

import { useDealWindows } from "./deal-windows";
import { dashboardMessageKey } from "./messages";

/**
 * "More actions for {title}": Edit, Move to stage, Mark won, Mark lost, Delete. Every action hands the trigger to the
 * deal windows, which return focus to it (or to the deal's region when the deal leaves the screen).
 */
export function DealMenu({ deal, className }: { deal: OpenDeal; className?: string }) {
  const text = useMessages(dashboardMessageKey);
  const locale = useLocale();
  const windows = useDealWindows();
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = text.deal.menu;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <CardIconButton
          ref={trigger}
          icon={Ellipsis}
          label={format(text.deal.moreActions, locale, { title: deal.title })}
          className={className}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => windows.openEdit(deal, trigger.current)}>
          <Pencil aria-hidden="true" />
          {menu.edit}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <MoveRight aria-hidden="true" />
            {menu.moveTo}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {openStages.map((stage) => (
                <DropdownMenuItem
                  key={stage}
                  disabled={stage === deal.stage}
                  onSelect={() => windows.move(deal, stage, trigger.current)}
                >
                  {text.stages[stage]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem onSelect={() => windows.close(deal, "won", trigger.current)}>
          <Trophy aria-hidden="true" />
          {menu.markWon}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => windows.close(deal, "lost", trigger.current)}>
          <CircleOff aria-hidden="true" />
          {menu.markLost}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => windows.askDelete(deal, trigger.current)}>
          <Trash2 aria-hidden="true" />
          {menu.delete}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
