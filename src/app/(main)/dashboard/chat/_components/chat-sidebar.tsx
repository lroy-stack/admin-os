"use client";

import { siFacebook, siInstagram, siWhatsapp } from "simple-icons";

import { SimpleIcon } from "@/components/simple-icon";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { formatNumber, useLocale, useMessages } from "@/core/i18n/client";

import { useChatBoard } from "./chat-context";
import { updateChat } from "./chat-session";
import { type ChatScope, sameScope, setScope, unreadIn } from "./chat-state";
import { channelItems, type NavItem, navItems, viewItems } from "./data";
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
              <ChatNavEntry key={item.id} item={item} scope={{ kind: "nav", id: item.id }} title={text.nav[item.id]} />
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
                scope={{ kind: "channel", id: item.id }}
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
              <ChatNavEntry
                key={item.id}
                item={item}
                scope={{ kind: "view", id: item.id }}
                title={text.views[item.id]}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

/** A view of the list: choosing it filters the conversations. The badge counts its unread conversations. */
function ChatNavEntry({
  item,
  scope,
  title,
  brandIcon,
}: {
  item: NavItem<string>;
  scope: ChatScope;
  title: string;
  brandIcon?: React.ComponentProps<typeof SimpleIcon>["icon"];
}) {
  const locale = useLocale();
  const { isMobile, setOpenMobile } = useSidebar();
  const { state, all } = useChatBoard();
  const isActive = sameScope(state.scope, scope);
  const unread = unreadIn(all, scope);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        className="[&_svg]:size-3.5"
        size="sm"
        isActive={isActive}
        aria-current={isActive ? "true" : undefined}
        tooltip={title}
        onClick={() => {
          updateChat((current) => setScope(current, scope));
          // On a phone the sidebar is a sheet over the page: choosing a view lets the list show.
          if (isMobile) setOpenMobile(false);
        }}
      >
        {brandIcon ? <SimpleIcon icon={brandIcon} /> : <item.icon />}
        <span className="font-medium">{title}</span>
      </SidebarMenuButton>
      {unread > 0 && <SidebarMenuBadge className="font-medium">{formatNumber(unread, locale)}</SidebarMenuBadge>}
    </SidebarMenuItem>
  );
}
