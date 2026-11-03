"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { FormDialog } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { kitMessageKey } from "./messages";

const EMPTY = { name: "", email: "", notes: "" };

export function FormSection() {
  const text = useMessages(kitMessageKey).form;
  const locale = useLocale();
  const ids = { form: useId(), name: useId(), email: useId(), notes: useId() };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const dirty = values.name !== "" || values.email !== "" || values.notes !== "";

  const change = (next: boolean) => {
    if (!next) setValues(EMPTY);
    setOpen(next);
  };
  const set = (field: keyof typeof EMPTY) => (value: string) =>
    setValues((current) => ({ ...current, [field]: value }));

  return (
    <KitSection title={text.title} description={text.description}>
      <Button variant="outline" onClick={() => change(true)}>
        {text.open}
      </Button>
      {submitted === null ? null : <p className="text-muted-foreground text-sm">{submitted}</p>}
      <FormDialog
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
            setSubmitted(format(text.submitted, locale, { name: values.name }));
            change(false);
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.name}>{text.nameLabel}</Label>
            <Input id={ids.name} value={values.name} onChange={(event) => set("name")(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.email}>{text.emailLabel}</Label>
            <Input
              id={ids.email}
              type="email"
              value={values.email}
              onChange={(event) => set("email")(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={ids.notes}>{text.notesLabel}</Label>
            <Textarea id={ids.notes} value={values.notes} onChange={(event) => set("notes")(event.target.value)} />
          </div>
        </form>
      </FormDialog>
    </KitSection>
  );
}
