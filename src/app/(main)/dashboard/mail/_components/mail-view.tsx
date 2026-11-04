"use client";

import { cn } from "cn";
import {
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  MailOpen,
  Pin,
  Tag,
  Trash2,
  X,
} from "lucide-react";

import { SimpleIcon } from "@/components/simple-icon";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatLocalDate, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import { MAIL_LABELS, type Mail } from "./data";
import { useMailActions } from "./mail-actions";
import { useMailbox } from "./mail-context";
import { updateMail } from "./mail-session";
import { focusMail, neighbour, toggleLabel } from "./mail-state";
import { mailMessageKey } from "./messages";

interface MailDisplayProps {
  mail: Mail | null;
  onClose?: () => void;
}

export function MailView({ mail, onClose }: MailDisplayProps) {
  const text = useMessages(mailMessageKey);
  const locale = useLocale();
  const { order } = useMailbox();
  const actions = useMailActions();
  const previous = mail ? neighbour(order, mail.id, -1) : null;
  const next = mail ? neighbour(order, mail.id, 1) : null;

  function handleClose() {
    updateMail((state) => focusMail(state, null));
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
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={text.view.previous}
                  disabled={previous === null}
                  onClick={() => actions.step(-1)}
                >
                  <ChevronLeft />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.view.previous}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={text.view.next}
                  disabled={next === null}
                  onClick={() => actions.step(1)}
                >
                  <ChevronRight />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{text.view.next}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={text.view.pinThread}
                aria-pressed={mail?.isPinned ?? false}
                disabled={!mail}
                onClick={() => mail && actions.togglePin(mail)}
              >
                <Pin className={cn(mail?.isPinned && "fill-current")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.pinThread}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={text.view.archive}
                disabled={!mail || mail.folder === "archive"}
                onClick={() => mail && actions.archive(mail, onClose)}
              >
                <Archive />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{text.view.archive}</TooltipContent>
          </Tooltip>
          {mail ? (
            <PopoverOrSheet
              title={text.view.addLabel}
              align="end"
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={text.view.addLabel}>
                  <Tag />
                </Button>
              }
            >
              <div className="flex flex-col gap-2">
                {MAIL_LABELS.map((label) => (
                  <Field key={label} orientation="horizontal">
                    <Checkbox
                      id={`mail-label-${label}`}
                      checked={mail.labels.includes(label)}
                      onCheckedChange={() => updateMail((state) => toggleLabel(state, mail, label))}
                    />
                    <FieldLabel htmlFor={`mail-label-${label}`} className="font-normal">
                      {text.labels[label]}
                    </FieldLabel>
                  </Field>
                ))}
              </div>
            </PopoverOrSheet>
          ) : (
            <Button variant="ghost" size="icon-sm" aria-label={text.view.addLabel} disabled>
              <Tag />
            </Button>
          )}
          <Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={text.view.moreActions} disabled={!mail}>
                    <EllipsisVertical />
                  </Button>
                </TooltipTrigger>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onSelect={() => mail && actions.markUnread(mail)}>
                    <MailOpen />
                    {text.view.markUnread}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <TooltipContent>{text.view.moreActions}</TooltipContent>
          </Tooltip>
          <Separator className="h-4 data-vertical:self-center" orientation="vertical" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={text.view.moveToTrash}
                disabled={!mail || mail.folder === "trash"}
                onClick={() => mail && actions.trash(mail, onClose)}
              >
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

              {mail.labels.length > 0 ? (
                <ul className="flex flex-wrap gap-1 pt-1">
                  {mail.labels.map((label) => (
                    <li key={label}>
                      <Badge variant="outline">{text.labels[label]}</Badge>
                    </li>
                  ))}
                </ul>
              ) : null}
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
                        <Badge variant="secondary" key={attachment.id}>
                          <SimpleIcon icon={attachment.icon} className="size-3 fill-current" />
                          <span className="font-normal">{attachment.name}</span>
                          <span className="text-muted-foreground font-normal">{attachment.size}</span>
                        </Badge>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator className="my-2" />
              </>
            ) : null}

            <div className="min-h-0 flex-1 scrollbar-none overflow-y-auto text-sm whitespace-pre-wrap">{mail.body}</div>
          </div>
        ) : (
          <div className="text-muted-foreground grid h-full place-items-center text-sm">{text.view.empty}</div>
        )}
      </div>
    </div>
  );
}
