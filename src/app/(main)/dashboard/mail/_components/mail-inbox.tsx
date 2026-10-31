"use client";

import { Ellipsis, RotateCcw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useMessages } from "@/core/i18n/client";

import { OpenStandaloneButton } from "../../_components/open-standalone-button";
import type { Mail } from "./data";
import { MailList } from "./mail-list";
import { mailMessageKey } from "./messages";

interface MailInboxProps {
  mails: Mail[];
  onSelectMail?: (mail: Mail) => void;
  standaloneHref?: string;
}

export function MailInbox({ mails, onSelectMail, standaloneHref }: MailInboxProps) {
  const text = useMessages(mailMessageKey);
  const pinnedMails = mails.filter((mail) => mail.isPinned);
  const unpinnedMails = mails.filter((mail) => !mail.isPinned);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 pt-3">
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 ml-1 h-4 data-vertical:self-center" />
          <h1 className="text-xl leading-none font-medium">{text.inbox.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label={text.inbox.viewOptions}>
            <SlidersHorizontal />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={text.inbox.refresh}>
            <RotateCcw />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={text.inbox.moreActions}>
            <Ellipsis />
          </Button>
          {standaloneHref && <OpenStandaloneButton href={standaloneHref} />}
        </div>
      </div>

      <div className="px-2">
        <Separator />
      </div>

      <div className="px-2">
        <InputGroup className="h-7 w-full rounded-md">
          <InputGroupInput className="h-7" placeholder={text.inbox.search} aria-label={text.inbox.search} />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        <MailList
          groups={[
            {
              id: "pinned",
              title: text.inbox.pinned,
              items: pinnedMails,
            },
            {
              id: "inbox",
              title: text.inbox.title,
              items: unpinnedMails,
            },
          ]}
          onSelectMail={onSelectMail}
        />
      </div>
    </div>
  );
}
