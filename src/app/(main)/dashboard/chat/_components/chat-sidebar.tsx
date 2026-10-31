"use client";

import { EllipsisVertical, LogOut, Settings, UserRound } from "lucide-react";
import { siFacebook, siInstagram, siWhatsapp } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { channelItems, currentUser, type NavItem, navItems, viewItems } from "./data";
import { chatMessageKey } from "./messages";

const channelBrandIcons = {
  whatsapp: siWhatsapp,
  instagram: siInstagram,
  facebook: siFacebook,
} as const;

export function ChatSidebar() {
  const text = useMessages(chatMessageKey);

  return (
    <Sidebar collapsible="offcanvas" className="**:data-[sidebar=sidebar]:bg-background absolute inset-y-0 h-full">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {navItems.map((item) => (
              <ChatNavEntry key={item.id} item={item} title={text.nav[item.id]} />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-normal">{text.sidebar.channels}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {channelItems.map((item) => (
              <ChatNavEntry
                key={item.id}
                item={item}
                title={text.channels[item.id]}
                brandIcon={
                  item.id in channelBrandIcons
                    ? channelBrandIcons[item.id as keyof typeof channelBrandIcons]
                    : undefined
                }
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-normal">{text.sidebar.views}</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {viewItems.map((item) => (
              <ChatNavEntry key={item.id} item={item} title={text.views[item.id]} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Separator />
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar>
                    <AvatarFallback className="text-xs">{getInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{currentUser.name}</span>
                    <span className="text-muted-foreground truncate text-xs">{currentUser.email}</span>
                  </div>
                  <EllipsisVertical className="ml-auto size-4 shrink-0" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" side="top">
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar>
                      <AvatarFallback className="text-xs">{getInitials(currentUser.name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{currentUser.name}</span>
                      <span className="text-muted-foreground truncate text-xs">{currentUser.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <UserRound />
                    {text.sidebar.account}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings />
                    {text.sidebar.settings}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  {text.sidebar.logOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatNavEntry({
  item,
  title,
  brandIcon,
}: {
  item: NavItem<string>;
  title: string;
  brandIcon?: React.ComponentProps<typeof SimpleIcon>["icon"];
}) {
  const locale = useLocale();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="[&_svg]:size-3.5" size="sm" isActive={item.isActive} tooltip={title}>
        {brandIcon ? <SimpleIcon icon={brandIcon} /> : <item.icon />}
        <span className="font-medium">{title}</span>
      </SidebarMenuButton>
      {item.count !== undefined && (
        <SidebarMenuBadge className="font-medium">{formatNumber(item.count, locale)}</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}
