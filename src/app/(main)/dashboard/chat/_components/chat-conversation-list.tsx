"use client";

import { cn } from "cn";
import { ChevronDown, Filter, Flag, MessageSquareOff, PanelRightClose, PanelRightOpen, Pin } from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";
import { getInitials } from "@/lib/utils";

import { useChatBoard } from "./chat-context";
import { updateChat } from "./chat-session";
import { type ChatScope, isConversationTab, selectConversation, setFilter, setTab, tabCounts } from "./chat-state";
import { CONVERSATION_TABS, type Conversation } from "./data";
import { type ChatMessages, chatMessageKey } from "./messages";

interface ChatConversationListProps {
  onSelectConversation?: (conversation: Conversation) => void;
  className?: string;
}

export function ChatConversationList({ onSelectConversation, className }: ChatConversationListProps) {
  const { state, all, visible } = useChatBoard();
  const text = useMessages(chatMessageKey);
  const locale = useLocale();
  const { state: sidebarState, toggleSidebar } = useSidebar();
  const isCollapsed = sidebarState === "collapsed";

  const counts = tabCounts(all, state);
  const filtered = state.query.trim() !== "" || state.filter.unread || state.filter.priority;
  const conversationGroups = visible.reduce<Array<{ group: Conversation["group"]; conversations: Conversation[] }>>(
    (groups, conversation) => {
      const group = groups.find((item) => item.group === conversation.group);
      if (group) {
        group.conversations.push(conversation);
      } else {
        groups.push({ group: conversation.group, conversations: [conversation] });
      }
      return groups;
    },
    [],
  );

  return (
    <div className={cn("flex h-full flex-col gap-3 pt-3", className)}>
      <div className="flex items-center justify-between gap-4 px-2 py-0.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleSidebar}
            aria-label={text.list.toggleSidebar}
            className="[&_svg]:transition-transform [&_svg]:duration-300"
          >
            {isCollapsed ? <PanelRightClose /> : <PanelRightOpen />}
          </Button>
          <Separator orientation="vertical" className="mr-1.5 h-4 data-vertical:self-center" />
          <h1 className="truncate text-xl leading-none font-medium">{scopeTitle(state.scope, text)}</h1>
        </div>
        <div className="flex items-center gap-2">
          <PopoverOrSheet
            title={text.list.filter}
            align="end"
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={text.list.filter}
                aria-pressed={state.filter.unread || state.filter.priority}
              >
                <Filter />
              </Button>
            }
          >
            <div className="flex flex-col gap-2">
              <Field orientation="horizontal">
                <Checkbox
                  id="chat-filter-unread"
                  checked={state.filter.unread}
                  onCheckedChange={(checked) =>
                    updateChat((current) => setFilter(current, { ...current.filter, unread: checked === true }))
                  }
                />
                <FieldLabel htmlFor="chat-filter-unread" className="font-normal">
                  {text.list.filters.unread}
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="chat-filter-priority"
                  checked={state.filter.priority}
                  onCheckedChange={(checked) =>
                    updateChat((current) => setFilter(current, { ...current.filter, priority: checked === true }))
                  }
                />
                <FieldLabel htmlFor="chat-filter-priority" className="font-normal">
                  {text.list.filters.priority}
                </FieldLabel>
              </Field>
            </div>
          </PopoverOrSheet>
        </div>
      </div>

      <Separator />

      <Tabs
        value={state.tab}
        onValueChange={(tab) => {
          if (isConversationTab(tab)) updateChat((current) => setTab(current, tab));
        }}
      >
        <TabsList variant="line" className="w-full border-b px-0 **:data-[slot=tabs-trigger]:border-x-0">
          {CONVERSATION_TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab}>
              {text.list.tabs[tab]}
              {counts[tab] > 0 && (
                <span className="text-muted-foreground text-xs">
                  {format(text.list.tabCount, locale, { count: counts[tab] })}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex min-h-0 flex-1 flex-col">
        {visible.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessageSquareOff />
              </EmptyMedia>
              <EmptyTitle>{filtered ? text.list.noResults : text.list.empty}</EmptyTitle>
              <EmptyDescription>{filtered ? text.list.noResultsHint : text.list.emptyHint}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea
            type="hover"
            className="**:data-[slot=scroll-area-viewport]:scroll-fade h-full min-h-0 flex-1 overflow-hidden [&_[data-orientation=vertical][data-slot=scroll-area-scrollbar]]:w-1.5"
          >
            <div className="flex flex-col gap-3 pt-0">
              {conversationGroups.map(({ group, conversations }) => (
                <Collapsible key={group} defaultOpen>
                  <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between gap-1 px-3 py-2 text-xs font-medium [&[data-state=open]>svg]:rotate-180">
                    {text.list.groups[group]}
                    <ChevronDown className="size-3 transition-transform" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="flex flex-col gap-1 px-2">
                      {conversations.map((conversation) => {
                        const isSelected = state.selected === conversation.id;

                        return (
                          <button
                            key={conversation.id}
                            type="button"
                            className={cn(
                              "w-full overflow-hidden rounded-lg px-2.5 py-2.5 text-left transition-colors ring-inset",
                              isSelected ? "bg-muted ring-border ring-1" : "hover:bg-muted/75",
                            )}
                            onClick={(event) => {
                              event.currentTarget.blur();
                              updateChat((current) => selectConversation(current, conversation.id));
                              onSelectConversation?.(conversation);
                            }}
                          >
                            <div className="flex min-w-0 items-start gap-2.5">
                              <Avatar className="shrink-0 **:data-[slot=avatar-badge]:size-2.5">
                                <AvatarFallback
                                  className={cn(
                                    "text-foreground text-xs transition-colors duration-400",
                                    isSelected && "bg-background/50",
                                  )}
                                >
                                  {getInitials(conversation.name)}
                                </AvatarFallback>
                                {conversation.isOnline && <AvatarBadge className="bg-green-600 dark:bg-green-800" />}
                              </Avatar>

                              <div className="w-0 flex-1 overflow-hidden">
                                <div className="flex w-full items-center justify-between gap-2">
                                  <div className="min-w-0 truncate text-sm leading-5 font-medium">
                                    {conversation.name}
                                  </div>
                                  <span className="text-muted-foreground shrink-0 text-xs leading-5 text-nowrap">
                                    {conversation.time}
                                  </span>
                                </div>
                                <div className="flex min-w-0 items-end gap-2">
                                  <div className="w-0 flex-1 overflow-hidden">
                                    <div className="text-foreground/90 truncate text-xs leading-4 font-medium">
                                      {conversation.subject}
                                    </div>
                                    <div className="text-muted-foreground truncate text-xs leading-4">
                                      {conversation.preview}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1">
                                    {conversation.isPriority && (
                                      <div className="grid size-5 place-items-center">
                                        <Flag
                                          className="size-3 fill-current opacity-70"
                                          aria-label={text.thread.priority}
                                        />
                                      </div>
                                    )}
                                    {conversation.group === "pinned" && (
                                      <div className="grid size-5 place-items-center">
                                        <Pin className="size-3 fill-current opacity-70" />
                                      </div>
                                    )}

                                    {conversation.isUnread && (
                                      <div className="bg-primary/90 text-primary-foreground grid size-5 place-items-center rounded-full text-xs">
                                        <span aria-hidden="true">{formatNumber(conversation.unreadCount, locale)}</span>
                                        <span className="sr-only">
                                          {format(text.list.unread, locale, { count: conversation.unreadCount })}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

/** The heading of the list: the name of the view, channel or saved view it shows. */
function scopeTitle(scope: ChatScope, text: ChatMessages): string {
  switch (scope.kind) {
    case "nav":
      return text.nav[scope.id];
    case "channel":
      return text.channels[scope.id];
    case "view":
      return text.views[scope.id];
    default: {
      const unreachable: never = scope;
      return unreachable;
    }
  }
}
