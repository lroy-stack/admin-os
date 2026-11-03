"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const STATUSES = ["optionAll", "optionConfirmed", "optionWaiting"] as const;

export function PopoverSection() {
  const text = useMessages(kitMessageKey).popover;
  const locale = useLocale();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("optionAll");

  return (
    <KitSection title={text.title} description={text.description}>
      <PopoverOrSheet
        trigger={<Button variant="outline">{text.open}</Button>}
        title={text.panelTitle}
        description={text.panelDescription}
      >
        {({ close }) => (
          <div className="flex flex-col gap-1">
            {STATUSES.map((option) => (
              <Button
                key={option}
                variant={option === status ? "secondary" : "ghost"}
                className="justify-start"
                aria-pressed={option === status}
                onClick={() => {
                  setStatus(option);
                  close();
                }}
              >
                {text[option]}
              </Button>
            ))}
          </div>
        )}
      </PopoverOrSheet>
      <p data-testid="kit-status" className="text-muted-foreground text-sm">
        {format(text.current, locale, { status: text[status] })}
      </p>
    </KitSection>
  );
}
