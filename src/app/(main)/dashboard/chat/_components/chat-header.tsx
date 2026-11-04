"use client";

import { MessageSquarePlus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useMessages } from "@/core/i18n/client";

import { OpenStandaloneButton } from "../../_components/open-standalone-button";
import { useChatBoard, useChatWindows } from "./chat-context";
import { updateChat } from "./chat-session";
import { setQuery } from "./chat-state";
import { chatMessageKey } from "./messages";

export function ChatHeader({ standaloneHref }: { standaloneHref?: string }) {
  const text = useMessages(chatMessageKey).header;
  const windows = useChatWindows();
  const { state } = useChatBoard();

  return (
    <header className="bg-background sticky top-0 z-50 flex h-(--header-height) w-full items-center border-b">
      <div className="flex h-full w-full items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="text-base font-medium text-nowrap">{text.title}</h1>
          <InputGroup className="h-7 w-full max-w-sm">
            <InputGroupInput
              type="search"
              className="h-7"
              placeholder={text.search}
              aria-label={text.search}
              value={state.query}
              onChange={(event) => updateChat((current) => setQuery(current, event.target.value))}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={text.newConversation}
            onClick={windows.openNewConversation}
          >
            <MessageSquarePlus />
          </Button>
          {standaloneHref && <OpenStandaloneButton href={standaloneHref} />}
        </div>
      </div>
    </header>
  );
}
