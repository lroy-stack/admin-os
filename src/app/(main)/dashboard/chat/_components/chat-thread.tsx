"use client";

import { type FormEvent, useState } from "react";

import { cn } from "cn";
import {
  AlarmClock,
  ArrowLeft,
  Copy,
  Flag,
  MessageSquareDashed,
  MoreHorizontal,
  PhoneCall,
  Send,
  Tag,
  UserRound,
} from "lucide-react";

import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import { updateChat } from "./chat-session";
import { appendMessage } from "./chat-state";
import { type Message as ChatMessage, type Conversation, currentUser } from "./data";
import { chatMessageKey } from "./messages";

interface ChatThreadProps {
  /** The conversation to show, or `null` when the list has none. */
  conversation: Conversation | null;
  onOpenContact?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  className?: string;
}

export function ChatThread({ conversation, ...props }: ChatThreadProps) {
  const text = useMessages(chatMessageKey);

  if (!conversation) {
    return (
      <div className={cn("flex h-full flex-col py-3", props.className)}>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareDashed />
            </EmptyMedia>
            <EmptyTitle>{text.thread.empty}</EmptyTitle>
            <EmptyDescription>{text.thread.emptyHint}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }
  return <ThreadBody conversation={conversation} {...props} />;
}

function ThreadBody({
  conversation,
  onOpenContact,
  onBack,
  showBackButton,
  className,
}: ChatThreadProps & { conversation: Conversation }) {
  const text = useMessages(chatMessageKey);
  const locale = useLocale();
  const { contact, dayLabel, messages } = conversation;

  return (
    <div className={cn("flex h-full flex-col py-3", className)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4 px-2">
          <div className="flex min-w-0 items-center gap-3">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label={text.thread.back}
                onClick={onBack}
              >
                <ArrowLeft />
              </Button>
            )}
            <Avatar className="size-8">
              <AvatarFallback className="bg-background text-foreground">{getInitials(contact.name)}</AvatarFallback>
              <AvatarBadge className="bg-green-600 dark:bg-green-800" />
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{contact.name}</div>
              <div className="text-muted-foreground truncate text-xs leading-4" title={contact.role}>
                {contact.role}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.thread.call}>
                  <PhoneCall />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.thread.call}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.thread.tag}>
                  <Tag />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.thread.tag}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.thread.snooze}>
                  <AlarmClock />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.thread.snooze}</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.thread.moreActions}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={onOpenContact}>
                    <UserRound />
                    {text.thread.viewProfile}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy />
                    {text.thread.copyEmail}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Flag />
                    {text.thread.markPriority}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem variant="destructive">{text.thread.blockContact}</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Separator />
      </div>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-6 px-2 py-8">
              <Marker variant="separator">
                <MarkerContent>{dayLabel}</MarkerContent>
              </Marker>

              {messages.map((message) => {
                const isOutbound = message.align === "end";
                const isNote = message.kind === "note";
                const reactionAlign = isOutbound ? "start" : "end";
                const senderName = isOutbound ? currentUser.name : contact.name;

                return (
                  <MessageScrollerItem
                    key={message.id}
                    messageId={String(message.id)}
                    scrollAnchor={message.align === "end"}
                  >
                    <Message align={message.align}>
                      <MessageAvatar>
                        <Avatar>
                          <AvatarFallback
                            className={cn(
                              "bg-muted text-foreground text-xs",
                              isOutbound && "bg-primary text-primary-foreground",
                            )}
                          >
                            {getInitials(senderName)}
                          </AvatarFallback>
                        </Avatar>
                      </MessageAvatar>

                      <MessageContent>
                        <BubbleGroup>
                          <Bubble variant={bubbleVariantOf(message)} align={message.align}>
                            <BubbleContent>{message.text}</BubbleContent>
                            {message.reaction ? (
                              <BubbleReactions
                                aria-label={format(text.thread.reaction, locale, { emoji: message.reaction })}
                                align={reactionAlign}
                              >
                                <span>{message.reaction}</span>
                              </BubbleReactions>
                            ) : null}
                          </Bubble>
                        </BubbleGroup>
                        <MessageFooter>
                          {isNote ? format(text.thread.noteMeta, locale, { time: message.time }) : message.time}
                        </MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                );
              })}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="px-2">
        <Tabs defaultValue="reply" className="gap-0 rounded-md border">
          <TabsList
            variant="line"
            className="w-full justify-start gap-2 border-b px-3 group-data-horizontal/tabs:h-10 **:data-[slot=tabs-trigger]:border-x-0 **:data-[slot=tabs-trigger]:px-6"
          >
            <TabsTrigger value="reply" className="flex-none px-1">
              {text.thread.reply}
            </TabsTrigger>
            <TabsTrigger value="note" className="flex-none px-1">
              {text.thread.internalNote}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reply" className="m-0">
            <MessageComposer key={conversation.id} conversationId={conversation.id} kind="reply" />
          </TabsContent>
          <TabsContent value="note" className="m-0">
            <MessageComposer key={conversation.id} conversationId={conversation.id} kind="note" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/** A note is tinted, a message from the team is solid, one from the contact is muted. */
function bubbleVariantOf(message: ChatMessage): "tinted" | "default" | "muted" {
  if (message.kind === "note") return "tinted";
  return message.align === "end" ? "default" : "muted";
}

/** Reply or Internal note: Send appends it to the conversation on the session's chat. */
function MessageComposer({ conversationId, kind }: { conversationId: number; kind: "reply" | "note" }) {
  const text = useMessages(chatMessageKey);
  const [value, setValue] = useState("");
  const empty = value.trim() === "";

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (empty) return;
    updateChat((state) => appendMessage(state, conversationId, { kind, text: value.trim(), time: text.time.justNow }));
    setValue("");
  }

  return (
    <form className="w-full" onSubmit={send}>
      <InputGroup className="border-0 bg-transparent shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-0 has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot][aria-invalid=true]]:border-0 has-[[data-slot][aria-invalid=true]]:ring-0 dark:bg-transparent dark:has-[[data-slot][aria-invalid=true]]:ring-0">
        <InputGroupTextarea
          placeholder={kind === "reply" ? text.thread.replyPlaceholder : text.thread.notePlaceholder}
          aria-label={kind === "reply" ? text.thread.reply : text.thread.internalNote}
          className="min-h-14 px-3 py-2.5 text-sm ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:aria-invalid:ring-0"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <span className="text-muted-foreground text-xs">{text.thread.demoNote}</span>
          <InputGroupButton type="submit" variant="default" size="icon-sm" className="ml-auto" disabled={empty}>
            <Send />
            <span className="sr-only">{kind === "reply" ? text.thread.send : text.thread.addNote}</span>
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
