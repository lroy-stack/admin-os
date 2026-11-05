"use client";

import { StickyNote } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";
import type { CapabilityActionOptions } from "@/ds/forms";
import { NOTE_MAX_LENGTH, noteFormSchema } from "@/modules/customers/ui";

import { useOpening } from "../../_components/use-opening";
import { addNote } from "../actions";
import { customerRecordMessageKey } from "./messages";
import { toNoteInput } from "./record-writes";
import { TextWriteWindow } from "./text-write-dialog";

/** "Add note" in the record's header and its window (customers.notes.add); the capability signs the note. */
export function AddNoteDialog({
  customerId,
  errors,
}: {
  customerId: string;
  errors: CapabilityActionOptions["errors"];
}) {
  const text = useMessages(customerRecordMessageKey).note;
  const { open, setOpen, opening, opener, show } = useOpening();

  return (
    <>
      <Button ref={opener} variant="outline" size="sm" onClick={show}>
        <StickyNote data-icon="inline-start" />
        {text.verb}
      </Button>
      <TextWriteWindow
        key={opening}
        title={text.verb}
        verb={text.verb}
        description={text.description}
        label={text.label}
        maxLength={NOTE_MAX_LENGTH}
        schema={noteFormSchema(text.invalid)}
        action={addNote}
        toInput={(values) => toNoteInput(customerId, values)}
        errors={errors}
        open={open}
        onOpenChange={setOpen}
        returnFocus={opener}
        onSaved={() => toast.success(text.saved)}
      />
    </>
  );
}
