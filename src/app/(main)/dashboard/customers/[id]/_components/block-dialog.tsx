"use client";

import { Ban } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import type { CapabilityActionOptions } from "@/ds/forms";
import { blockFormSchema, REASON_MAX_LENGTH } from "@/modules/customers/ui";

import { useOpening } from "../../_components/use-opening";
import { blockCustomer } from "../actions";
import { BLOCK_TOGGLE, findBlockToggle } from "./block-toggle";
import { customerRecordMessageKey } from "./messages";
import { toBlockInput } from "./record-writes";
import { TextWriteWindow } from "./text-write-dialog";

/** "Block" in the record's header and its window, which asks for the reason (customers.block). */
export function BlockDialog({
  customerId,
  customerName,
  errors,
}: {
  customerId: string;
  customerName: string;
  errors: CapabilityActionOptions["errors"];
}) {
  const text = useMessages(customerRecordMessageKey).block;
  const locale = useLocale();
  const { open, setOpen, opening, opener, show } = useOpening();

  return (
    <>
      <Button ref={opener} variant="outline" size="sm" onClick={show} {...BLOCK_TOGGLE}>
        <Ban data-icon="inline-start" />
        {text.verb}
      </Button>
      <TextWriteWindow
        key={opening}
        title={text.title}
        verb={text.verb}
        description={text.description}
        label={text.label}
        maxLength={REASON_MAX_LENGTH}
        schema={blockFormSchema(text.invalid)}
        action={blockCustomer}
        toInput={(values) => toBlockInput(customerId, values.text)}
        errors={errors}
        open={open}
        onOpenChange={setOpen}
        returnFocus={findBlockToggle}
        onSaved={() => toast.success(format(text.done, locale, { name: customerName }))}
      />
    </>
  );
}
