"use client";

import * as React from "react";

import { cn } from "cn";
import { Check, EllipsisVertical, LogOut, PenLine, Settings2, UserPlus, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { accounts, type MailNavItem, mailNavigation } from "./data";
import { mailMessageKey } from "./messages";

export function MailSidebar() {
  const { state } = useSidebar();
  const text = useMessages(mailMessageKey);
  const locale = useLocale();
  const isCollapsed = state === "collapsed";
  const [selectedAccount, setSelectedAccount] = React.useState(accounts[0]);

  return (
    <Sidebar collapsible="icon" className="**:data-[sidebar=sidebar]:bg-background absolute inset-y-0 h-full">
      <SidebarHeader className="gap-3 py-3 pb-1">
        <div className="flex items-center justify-between">
          {isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className={accountTriggerClassName}
                  aria-label={format(text.sidebar.openMenuOf, locale, { name: selectedAccount.label })}
                >
                  <AccountMarker account={selectedAccount} isSelected />
                </Button>
              </DropdownMenuTrigger>
              <AccountMenuContent
                selectedAccountId={selectedAccount.id}
                onSelectAccount={setSelectedAccount}
                showAccounts
                side="right"
                align="start"
              />
            </DropdownMenu>
          ) : (
            <>
              <ToggleGroup
                type="single"
                value={String(selectedAccount.id)}
                onValueChange={(value) => {
                  const account = accounts.find((item) => item.id === Number(value));

                  if (account) {
                    setSelectedAccount(account);
                  }
                }}
                spacing={2}
              >
                {accounts.map((account) => (
                  <ToggleGroupItem
                    key={account.id}
                    className={accountTriggerClassName}
                    value={String(account.id)}
                    aria-label={format(text.sidebar.selectAccount, locale, { name: account.label })}
                  >
                    <AccountMarker account={account} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={text.sidebar.openAccountMenu}>
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <AccountMenuContent selectedAccountId={selectedAccount.id} onSelectAccount={setSelectedAccount} />
              </DropdownMenu>
            </>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-1.5 group-data-[state=collapsed]:hidden">
          <div className="text-sm leading-none font-medium">{selectedAccount.label}</div>
          <div className="text-muted-foreground truncate text-sm leading-none">{selectedAccount.email}</div>
        </div>

        <Button size={isCollapsed ? "icon-sm" : "sm"} variant="outline" className="group-data-[state=expanded]:w-full">
          <PenLine data-icon="inline-start" />
          <span className="group-data-[state=collapsed]:hidden">{text.sidebar.newEmail}</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {mailNavigation.navMain.map((nav) => (
              <NavEntry key={nav.id} nav={nav} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-normal">{text.sidebar.folders}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {mailNavigation.folders.map((nav) => (
              <NavEntry key={nav.id} nav={nav} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="gap-1">
          {mailNavigation.navFooter.map((nav) => (
            <NavEntry key={nav.id} nav={nav} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavEntry({ nav }: { nav: MailNavItem }) {
  const text = useMessages(mailMessageKey);
  const locale = useLocale();
  const title = text.nav[nav.id];

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="[&_svg]:size-3.5" size="sm" isActive={nav.isActive} tooltip={title}>
        <nav.icon />
        <span className="font-medium">{title}</span>
      </SidebarMenuButton>
      {nav.count !== undefined && (
        <SidebarMenuBadge className="font-medium">{formatNumber(nav.count, locale)}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}

const accountTriggerClassName = cn(
  "relative size-7 min-w-7 rounded-sm p-0 transition-colors",
  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground text-xs",
  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
  "data-[state=on]:ring data-[state=on]:ring-green-600",
  "focus-visible:border-transparent focus-visible:ring-0",
);

type Account = (typeof accounts)[number];

function AccountMarker({ account, isSelected = false }: { account: Account; isSelected?: boolean }) {
  return (
    <>
      {getInitials(account.label).slice(0, 1)}
      <span
        className={cn(
          "text-primary-foreground ring-background absolute right-0 bottom-0 z-10 hidden size-2.5 items-center justify-center rounded-full bg-green-600 ring-[1.25px] group-data-[state=on]/toggle:flex",
          isSelected && "flex",
        )}
      >
        <Check className="size-2" />
      </span>
    </>
  );
}

function AccountMenuContent({
  selectedAccountId,
  onSelectAccount,
  showAccounts = false,
  ...props
}: {
  selectedAccountId: number;
  onSelectAccount: (account: Account) => void;
  showAccounts?: boolean;
} & Pick<React.ComponentProps<typeof DropdownMenuContent>, "align" | "side">) {
  const text = useMessages(mailMessageKey);

  return (
    <DropdownMenuContent className="w-56" {...props}>
      {showAccounts && (
        <>
          <DropdownMenuLabel>{text.sidebar.accounts}</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={String(selectedAccountId)}
              onValueChange={(value) => {
                const account = accounts.find((item) => item.id === Number(value));

                if (account) {
                  onSelectAccount(account);
                }
              }}
            >
              {accounts.map((account) => (
                <DropdownMenuRadioItem key={account.id} value={String(account.id)}>
                  <div className="flex min-w-0 flex-col">
                    <span>{account.label}</span>
                    <span className="text-muted-foreground truncate text-xs">{account.email}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <UserPlus />
          {text.sidebar.addAccount}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <UsersRound />
          {text.sidebar.manageAccounts}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings2 />
          {text.sidebar.accountSettings}
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <LogOut />
          {text.sidebar.signOut}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
