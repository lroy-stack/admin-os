"use client";

import { cn } from "cn";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Forward,
  MailOpen,
  Paperclip,
  Pin,
  Reply,
  ReplyAll,
  Send,
  Smile,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { SimpleIcon } from "@/components/simple-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatLocalDate, useLocale, useMessages } from "@/core/i18n/client";

import type { Mail } from "./data";
import { mailMessageKey } from "./messages";
import { useMail } from "./use-mail";

interface MailDisplayProps {
  mail: Mail | null;
  onClose?: () => void;
}

export function MailView({ mail, onClose }: MailDisplayProps) {
  const [, setMail] = useMail();
  const text = useMessages(mailMessageKey);
  const locale = useLocale();

  function handleClose() {
    setMail({ selected: null });
    onClose?.();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-2 py-3">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={text.view.close} onClick={handleClose}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.close}</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <div className="flex items-center gap-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.view.previous}>
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.view.previous}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={text.view.next}>
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.view.next}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={text.view.pinThread}>
                <Pin />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.pinThread}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={text.view.archive}>
                <Archive />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.archive}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={text.view.reply}>
                <Reply />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.reply}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={text.view.moreActions}>
                    <EllipsisVertical />
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <ReplyAll />
                    {text.view.replyAll}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Forward />
                    {text.view.forward}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <MailOpen />
                    {text.view.markUnread}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Tag />
                    {text.view.addLabel}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>{text.view.moreActions}</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={text.view.moveToTrash}>
                <Trash2 className="text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.moveToTrash}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <Separator />

      <div className="flex min-h-0 flex-1 flex-col">
        {mail ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="space-y-1.5">
              <div className="leading-snug font-medium break-words hyphens-auto">{mail.subject}</div>

              <div className="text-muted-foreground text-xs leading-none">
                {formatLocalDate(new Date(mail.receivedAt), locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Avatar className="size-9 after:rounded-sm">
                <AvatarFallback className="bg-background rounded-sm">{mail.from.name[0]}</AvatarFallback>
              </Avatar>

              <div className="flex h-full min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <div className="text-xs">{mail.from.name}</div>
                  <Separator className="h-3 data-vertical:self-center" orientation="vertical" />
                  <div className="text-muted-foreground text-xs">{mail.from.email}</div>
                </div>
                <div className="flex flex-wrap items-center gap-x-2">
                  <div className="text-muted-foreground text-xs">
                    {text.view.to}{" "}
                    <span className="text-foreground">{mail.to.map((recipient) => recipient.name).join(", ")}</span>
                  </div>

                  {mail.cc?.length ? (
                    <div className="text-muted-foreground text-xs">
                      {text.view.cc}{" "}
                      <span className="text-foreground">{mail.cc.map((recipient) => recipient.name).join(", ")}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <Separator />

            {mail.attachments?.length ? (
              <>
                <Collapsible defaultOpen>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "group text-muted-foreground p-0 font-normal",
                        "hover:text-muted-foreground hover:bg-transparent dark:hover:bg-transparent",
                        "data-[state=open]:text-muted-foreground data-[state=open]:bg-transparent",
                      )}
                    >
                      {format(text.view.attachments, locale, { count: mail.attachments.length })}
                      <ChevronDown className="group-data-[state=open]:rotate-180" />
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="flex flex-wrap gap-2">
                      {mail.attachments.map((attachment) => (
                        <Button size="xs" variant="secondary" key={attachment.id}>
                          <SimpleIcon icon={attachment.icon} className="size-3 fill-current" />
                          <span className="font-normal">{attachment.name}</span>
                          <span className="text-muted-foreground font-normal">{attachment.size}</span>
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />
              </>
            ) : null}

            <div className="min-h-0 flex-1 scrollbar-none overflow-y-auto text-sm whitespace-pre-wrap">{mail.body}</div>

            <div className="mt-auto flex flex-col gap-3">
              <Separator />
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <Reply />
                </InputGroupAddon>
                <InputGroupInput
                  className="text-xs"
                  placeholder={format(text.view.replyPlaceholder, locale, { name: mail.from.name })}
                />
                <InputGroupAddon className="gap-1" align="inline-end">
                  <InputGroupButton variant="ghost" aria-label={text.view.emoji}>
                    <Smile />
                  </InputGroupButton>
                  <InputGroupButton variant="ghost" aria-label={text.view.attach}>
                    <Paperclip />
                  </InputGroupButton>
                  <InputGroupButton variant="ghost" aria-label={text.view.send}>
                    <Send />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground grid h-full place-items-center text-sm">{text.view.empty}</div>
        )}
      </div>
    </div>
  );
}
