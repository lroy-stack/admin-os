"use client";

import { useRef, useState } from "react";

import { MoreHorizontal } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { ConfirmAction } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const DEMO_LATENCY_MS = 400;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function ConfirmSection() {
  const text = useMessages(kitMessageKey).confirm;
  const locale = useLocale();
  const [confirmed, setConfirmed] = useState(0);
  const [menuConfirm, setMenuConfirm] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const reasonSchema = z.string().trim().min(3, text.withReason.reasonTooShort);

  return (
    <KitSection title={text.title} description={text.description}>
      <div className="flex flex-wrap gap-2">
        <ConfirmAction
          destructive
          verb={text.plain.open}
          title={text.plain.title}
          consequence={text.plain.consequence}
          trigger={<Button variant="outline">{text.plain.open}</Button>}
          onConfirm={async () => {
            await wait(DEMO_LATENCY_MS);
            setConfirmed((count) => count + 1);
            return { status: "ok" };
          }}
        />
        <ConfirmAction
          destructive
          verb={text.withReason.open}
          title={text.withReason.title}
          consequence={text.withReason.consequence}
          reason={{ label: text.withReason.reasonLabel, schema: reasonSchema }}
          trigger={<Button variant="outline">{text.withReason.open}</Button>}
          onConfirm={async () => {
            await wait(DEMO_LATENCY_MS);
            setConfirmed((count) => count + 1);
            return { status: "ok" };
          }}
        />
        <ConfirmAction
          destructive
          verb={text.failing.open}
          title={text.failing.title}
          consequence={text.failing.consequence}
          trigger={<Button variant="outline">{text.failing.open}</Button>}
          onConfirm={async () => {
            await wait(DEMO_LATENCY_MS);
            return { status: "error", text: text.failing.refusal, code: "demo.refused" };
          }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button ref={menuTrigger} variant="outline" size="icon" aria-label={text.menu.trigger}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setMenuConfirm(true)}>{text.menu.item}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ConfirmAction
          destructive
          open={menuConfirm}
          onOpenChange={setMenuConfirm}
          returnFocus={menuTrigger}
          verb={text.plain.open}
          title={text.plain.title}
          consequence={text.plain.consequence}
          onConfirm={async () => {
            await wait(DEMO_LATENCY_MS);
            setConfirmed((count) => count + 1);
            return { status: "ok" };
          }}
        />
      </div>
      <p role="status" data-testid="confirmed-count" className="text-muted-foreground text-sm">
        {format(text.confirmed, locale, { count: confirmed })}
      </p>
    </KitSection>
  );
}
