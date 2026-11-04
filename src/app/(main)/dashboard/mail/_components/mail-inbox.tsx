"use client";

import { Inbox, Search, SearchX, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import { OpenStandaloneButton } from "../../_components/open-standalone-button";
import type { Mail } from "./data";
import { useMailbox } from "./mail-context";
import { MailList } from "./mail-list";
import { updateMail } from "./mail-session";
import { isMailSort, MAIL_SORTS, setQuery, setSort } from "./mail-state";
import { mailMessageKey } from "./messages";

interface MailInboxProps {
  onSelectMail?: (mail: Mail) => void;
  standaloneHref?: string;
}

export function MailInbox({ onSelectMail, standaloneHref }: MailInboxProps) {
  const text = useMessages(mailMessageKey);
  const { state, visible } = useMailbox();
  const pinnedMails = visible.filter((mail) => mail.isPinned);
  const unpinnedMails = visible.filter((mail) => !mail.isPinned);
  const searching = state.query.trim() !== "";
  const folderTitle = text.nav[state.folder];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pt-3">
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex min-w-0 items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 ml-1 h-4 data-vertical:self-center" />
          <h1 className="truncate text-xl leading-none font-medium">{folderTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <PopoverOrSheet
            title={text.inbox.viewOptions}
            align="end"
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label={text.inbox.viewOptions}>
                <SlidersHorizontal />
              </Button>
            }
          >
            <FieldSet>
              <FieldLegend variant="label">{text.inbox.sortBy}</FieldLegend>
              <RadioGroup
                value={state.sort}
                onValueChange={(value) => {
                  if (isMailSort(value)) updateMail((current) => setSort(current, value));
                }}
              >
                {MAIL_SORTS.map((sort) => (
                  <Field key={sort} orientation="horizontal">
                    <RadioGroupItem value={sort} id={`mail-sort-${sort}`} />
                    <FieldLabel htmlFor={`mail-sort-${sort}`} className="font-normal">
                      {text.inbox.sorts[sort]}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
            </FieldSet>
          </PopoverOrSheet>
          {standaloneHref && <OpenStandaloneButton href={standaloneHref} />}
        </div>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      <div className="px-2">
        <InputGroup className="h-7 w-full rounded-md">
          <InputGroupInput
            data-mail-search
            type="search"
            className="h-7"
            placeholder={text.inbox.search}
            aria-label={text.inbox.search}
            value={state.query}
            onChange={(event) => updateMail((current) => setQuery(current, event.target.value))}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {visible.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">{searching ? <SearchX /> : <Inbox />}</EmptyMedia>
              <EmptyTitle>{searching ? text.inbox.noResults : text.inbox.emptyFolder}</EmptyTitle>
              <EmptyDescription>{searching ? text.inbox.noResultsHint : text.inbox.emptyFolderHint}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <MailList
            groups={[
              { id: "pinned", title: text.inbox.pinned, items: pinnedMails },
              { id: "inbox", title: folderTitle, items: unpinnedMails },
            ].filter((group) => group.items.length > 0)}
            onSelectMail={onSelectMail}
          />
        )}
      </div>
    </div>
  );
}
