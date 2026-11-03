"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useGuardedExit, useGuardedLink } from "@/ds/feedback";
import { DiscardChanges } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const AWAY = "/dashboard/default";

/** A page-level form: with unsaved text, a link away, Back and a reload all ask first. */
export function GuardSection() {
  const text = useMessages(kitMessageKey).guard;
  const locale = useLocale();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState("");
  const dirty = note !== saved;
  const exit = useGuardedExit(dirty);
  const guardLink = useGuardedLink();
  const router = useRouter();

  return (
    <KitSection title={text.title} description={text.description}>
      <form
        className="flex w-full flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(note);
        }}
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kit-guard-note">{text.noteLabel}</Label>
          <Input id="kit-guard-note" value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <Button type="submit" variant="outline" className="self-start" disabled={!dirty}>
          {text.save}
        </Button>
      </form>
      {saved === "" ? null : (
        <p data-testid="kit-note-saved" className="text-muted-foreground text-sm">
          {format(text.saved, locale, { note: saved })}
        </p>
      )}
      <Button type="button" variant="ghost" className="self-start" onClick={() => router.refresh()}>
        {text.refresh}
      </Button>
      <Link href={AWAY} onNavigate={guardLink(AWAY)} className="text-sm underline underline-offset-4">
        {text.link}
      </Link>
      <DiscardChanges
        open={exit.asking}
        onOpenChange={(next) => {
          if (!next) exit.stay();
        }}
        onDiscard={exit.leave}
      />
    </KitSection>
  );
}
