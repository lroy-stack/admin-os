"use client";

import { type RefObject, useMemo, useRef, useState } from "react";

import { Plus } from "lucide-react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { type CapabilityActionOptions, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { FormDialog } from "@/ds/overlays";
import {
  ContactFields,
  type ContactFormInput,
  type ContactFormValues,
  contactFieldsMessageKey,
  contactFormSchema,
  contactQuery,
  EMPTY_CONTACT,
  toCreateInput,
} from "@/modules/customers/ui";

import { createContact, findDuplicateContacts } from "../actions";
import { DuplicateNotice } from "./duplicate-notice";
import { customerDirectoryMessageKey } from "./messages";
import { useDuplicateMatches } from "./use-duplicate-matches";

interface ContactWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  errors: CapabilityActionOptions["errors"];
  returnFocus: RefObject<HTMLElement | null>;
}

/** The form and its state. The opener remounts it per opening, so every opening starts empty and clean. */
function ContactWindow({ open, onOpenChange, errors, returnFocus }: ContactWindowProps) {
  const text = useMessages(customerDirectoryMessageKey).newContact;
  const fieldText = useMessages(contactFieldsMessageKey);
  const locale = useLocale();
  const schema = useMemo(() => contactFormSchema(fieldText.invalid), [fieldText.invalid]);
  const create = useCapabilityAction(createContact, errors === undefined ? {} : { errors });

  const submittedName = useRef("");
  const windowForm = useWindowForm<ContactFormInput, ContactFormValues>(schema, {
    defaultValues: EMPTY_CONTACT,
    submit: (values) => {
      submittedName.current = values.name;
      return create.run(toCreateInput(values));
    },
    onDone: () => {
      toast.success(format(text.added, locale, { name: submittedName.current }));
      onOpenChange(false);
    },
  });
  const { form } = windowForm;

  const [phone, email] = useWatch({ control: form.control, name: ["phone", "email"] });
  const query = contactQuery({ name: "", phone, email });
  const matches = useDuplicateMatches(query, findDuplicateContacts);

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

/** The "Add contact" button of the directory and the window it opens (plan 003, C3). */
export function NewContactDialog({ errors }: { errors: CapabilityActionOptions["errors"] }) {
  const text = useMessages(customerDirectoryMessageKey).newContact;
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={opener}
        variant="ghost"
        className="liquid-glass hover:bg-foreground/10 h-8 rounded-full px-3 text-xs"
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        <Plus data-icon="inline-start" />
        {text.verb}
      </Button>
      <ContactWindow key={opening} open={open} onOpenChange={setOpen} errors={errors} returnFocus={opener} />
    </>
  );
}
