"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const DEFAULT_PARTY = "2";

export function QuickSection() {
  const text = useMessages(kitMessageKey).quick;
  const locale = useLocale();
  const ids = { form: useId(), name: useId(), party: useId() };
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const dirty = name !== "" || party !== DEFAULT_PARTY;

  const change = (next: boolean) => {
    if (!next) {
      setName("");
      setParty(DEFAULT_PARTY);
    }
    setOpen(next);
  };

  return (
    <KitSection title={text.title} description={text.description}>
      <Button variant="outline" onClick={() => change(true)}>
        {text.open}
      </Button>
      {submitted === null ? null : <p className="text-muted-foreground text-sm">{submitted}</p>}
      <QuickDialog
        demo
        open={open}
        onOpenChange={change}
        dirty={dirty}
        title={text.windowTitle}
        description={text.windowDescription}
        footer={({ close }) => (
          <>
            <Button variant="outline" onClick={close}>
              {text.cancel}
            </Button>
            <Button type="submit" form={ids.form}>
              {text.submit}
            </Button>
          </>
        )}
      >
        <form
          id={ids.form}
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(format(text.submitted, locale, { name }));
            change(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.name}>{text.nameLabel}</Label>
            <Input id={ids.name} value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.party}>{text.partyLabel}</Label>
            <Input
              id={ids.party}
              type="number"
              inputMode="numeric"
              min={1}
              value={party}
              onChange={(event) => setParty(event.target.value)}
            />
          </div>
        </form>
      </QuickDialog>
    </KitSection>
  );
}
