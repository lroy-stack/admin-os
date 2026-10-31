import { Bell, MessageSquarePlus, Search, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { getMessages } from "@/config/locale.server";

import { OpenStandaloneButton } from "../../_components/open-standalone-button";
import { chatMessages } from "./messages.server";

export async function ChatHeader({ standaloneHref }: { standaloneHref?: string }) {
  const text = (await getMessages(chatMessages)).header;

  return (
    <header className="bg-background sticky top-0 z-50 flex h-(--header-height) w-full items-center border-b">
      <div className="flex h-full w-full items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 className="text-base font-medium text-nowrap">{text.title}</h1>
          <InputGroup className="h-7 w-full max-w-sm">
            <InputGroupInput className="h-7" placeholder={text.search} aria-label={text.search} />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label={text.newConversation}>
            <MessageSquarePlus />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={text.notifications}>
            <Bell />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label={text.settings}>
            <Settings />
          </Button>
          {standaloneHref && <OpenStandaloneButton href={standaloneHref} />}
        </div>
      </div>
    </header>
  );
}
