"use client";

import { type RefObject, useCallback, useMemo } from "react";

import { Pencil } from "lucide-react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";
import { type CapabilityActionOptions, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { FormDialog } from "@/ds/overlays";
import {
  ContactFields,
  type ContactFormInput,
  type ContactFormValues,
  contactFieldsMessageKey,
  contactFormSchema,
  contactQuery,
  toUpdateInput,
} from "@/modules/customers/ui";

import { DuplicateNotice } from "../../_components/duplicate-notice";
import { useDuplicateMatches } from "../../_components/use-duplicate-matches";
import { useOpening } from "../../_components/use-opening";
import { findDuplicateContacts } from "../../actions";
import { updateContact } from "../actions";
import { customerRecordMessageKey } from "./messages";
import { excludingSelf } from "./record-writes";

interface EditContactProps {
  customerId: string;
  /** The record's current details, which the form starts from. */
  initial: ContactFormInput;
  errors: CapabilityActionOptions["errors"];
}

function EditWindow({
  customerId,
  initial,
  errors,
  open,
  onOpenChange,
  returnFocus,
}: EditContactProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const text = useMessages(customerRecordMessageKey).edit;
  const fieldText = useMessages(contactFieldsMessageKey);
  const schema = useMemo(() => contactFormSchema(fieldText.invalid), [fieldText.invalid]);
  const update = useCapabilityAction(updateContact, errors === undefined ? {} : { errors });

  const windowForm = useWindowForm<ContactFormInput, ContactFormValues>(schema, {
    defaultValues: initial,
    submit: (values) => update.run(toUpdateInput(customerId, values)),
    onDone: () => {
      toast.success(text.saved);
      onOpenChange(false);
    },
  });
  const { form } = windowForm;

  const [phone, email] = useWatch({ control: form.control, name: ["phone", "email"] });
  const query = contactQuery({ name: "", phone, email });
  // The customer being edited always shares their own details, so they are not a duplicate of themselves.
  const others = useCallback(
    (asked: Parameters<typeof findDuplicateContacts>[0]) =>
      findDuplicateContacts(asked).then((matches) => excludingSelf(matches, customerId)),
    [customerId],
  );
  const matches = useDuplicateMatches(query, others);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={text.verb}
      description={text.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={text.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <ContactFields control={form.control} readOnly={windowForm.awaiting} />
        <DuplicateNotice matches={matches} query={query} onNavigate={() => onOpenChange(false)} />
      </form>
    </FormDialog>
  );
}

/** "Edit contact" in the record's header and the window it opens (customers.contact.update). */
export function EditContactDialog(props: EditContactProps) {
  const text = useMessages(customerRecordMessageKey).edit;
  const { open, setOpen, opening, opener, show } = useOpening();

  return (
    <>
      <Button ref={opener} variant="outline" size="sm" onClick={show}>
        <Pencil data-icon="inline-start" />
        {text.verb}
      </Button>
      <EditWindow key={opening} {...props} open={open} onOpenChange={setOpen} returnFocus={opener} />
    </>
  );
}
