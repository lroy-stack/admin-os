"use client";

import { useOptimistic, useTransition } from "react";

import { BadgeCheck, Bell, CreditCard, LogOut, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { shellMessageKey } from "./messages";
import type { ShellAccount, ShellDemo, ShellSwitch } from "./types";

function DemoSwitch({ label, control, failed }: { label: string; control: ShellSwitch; failed: string }) {
  const [value, setValue] = useOptimistic(control.value);
  const [, startTransition] = useTransition();

  const onValueChange = (id: string) => {
    startTransition(async () => {
      setValue(id);
      try {
        await control.onSelect(id);
      } catch {
        // The optimistic value reverts when the transition ends; tell the visitor why.
        toast.error(failed);
      }
    });
  };

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel className="text-muted-foreground text-xs">{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
        {control.options.map((option) => (
          <DropdownMenuRadioItem key={option.id} value={option.id}>
            {option.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
}

export function AccountMenu({ account, demo }: { account: ShellAccount; demo?: ShellDemo }) {
  const { account: text } = useMessages(shellMessageKey);
  const locale = useLocale();
  const [, startTransition] = useTransition();

  const onReset = (demoControls: ShellDemo) => {
    startTransition(async () => {
      try {
        await demoControls.onReset();
        toast.success(text.demo.resetDone);
      } catch {
        toast.error(text.demo.failed);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2">
        <Avatar className="size-9">
          <AvatarFallback className="bg-brand/85 text-brand-foreground text-xs font-medium">
            {getInitials(account.name)}
          </AvatarFallback>
        </Avatar>
        <span className="sr-only">{format(text.label, locale, { name: account.name })}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-56 space-y-1 rounded-lg" side="bottom" align="end" sideOffset={4}>
        <div className="flex items-center gap-2 px-1 py-1.5">
          <Avatar className="size-9 rounded-lg">
            <AvatarImage src={account.avatar || undefined} alt={account.name} />
            <AvatarFallback>{getInitials(account.name)}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{account.name}</span>
            <span className="truncate text-xs">{account.role}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            {text.account}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            {text.billing}
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            {text.notifications}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        {demo && (
          <>
            <DropdownMenuSeparator />
            <DemoSwitch label={text.demo.role} control={demo.role} failed={text.demo.failed} />
            <DropdownMenuSeparator />
            <DemoSwitch label={text.demo.preset} control={demo.preset} failed={text.demo.failed} />
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onReset(demo)}>
              <RotateCcw />
              {text.demo.reset}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          {text.logOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
