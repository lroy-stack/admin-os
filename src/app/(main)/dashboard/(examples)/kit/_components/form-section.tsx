"use client";

import { useState } from "react";

import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog } from "@/ds/overlays";

import { KitSection } from "./kit-section";
import { type KitMessages, kitMessageKey } from "./messages";

const DEMO_LATENCY_MS = 400;
const OUTCOMES = ["ok", "invalid", "error", "awaiting_approval"] as const;
type DemoOutcome = (typeof OUTCOMES)[number];
const OUTCOME_LABEL = { ok: "ok", invalid: "invalid", error: "error", awaiting_approval: "awaiting" } as const;

const isDemoOutcome = (value: string): value is DemoOutcome => OUTCOMES.some((outcome) => outcome === value);

/** The window of one opening: the form keeps its state while open and a fresh one replaces it the next time. */
function GuestWindow({
  text,
  open,
  onOpenChange,
  onAdded,
  onAttempt,
}: {
  text: KitMessages["form"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (name: string) => void;
  onAttempt: () => void;
}) {
  const [outcome, setOutcome] = useState<DemoOutcome>("ok");
  const schema = z.object({
    name: z.string().trim().min(1, text.nameRequired),
    email: z.union([z.literal(""), z.email(text.emailInvalid)]),
    notes: z.string(),
  });
  const { form, formProps, pending, dirty, formError, awaiting } = useWindowForm(schema, {
    defaultValues: { name: "", email: "", notes: "" },
    submit: async (values): Promise<ActionOutcome<string>> => {
      onAttempt();
      await new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY_MS));
      switch (outcome) {
        case "ok":
          return { status: "ok", value: values.name };
        case "invalid":
          return { status: "invalid", issues: [{ path: ["email"], message: text.emailTaken }] };
        case "error":
          return { status: "error", text: text.failed, code: "demo.unavailable" };
        case "awaiting_approval":
          return { status: "awaiting_approval" };
        default: {
          const unreachable: never = outcome;
          return unreachable;
        }
      }
    },
    onDone: (name) => {
      onAdded(name);
      onOpenChange(false);
    },
  });

  return (
    <FormDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={dirty}
      title={text.windowTitle}
      description={text.windowDescription}
      footer={({ close }) => (
        <FormFooter
          verb={text.submit}
          formId={formProps.id}
          pending={pending}
          error={formError}
          onCancel={close}
          approval={awaiting ? { action: text.windowTitle, role: text.approvalRole } : null}
        />
      )}
    >
      <div className="flex flex-col gap-4">
        <form {...formProps} className="flex flex-col gap-4">
          <FormField control={form.control} name="name" label={text.nameLabel} readOnly={awaiting}>
            {(field) => <Input {...field} />}
          </FormField>
          <FormField control={form.control} name="email" label={text.emailLabel} readOnly={awaiting}>
            {(field) => <Input {...field} type="email" />}
          </FormField>
          <FormField control={form.control} name="notes" label={text.notesLabel} readOnly={awaiting}>
            {(field) => <Textarea {...field} />}
          </FormField>
        </form>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kit-demo-outcome">{text.outcomeLabel}</Label>
          <NativeSelect
            id="kit-demo-outcome"
            value={outcome}
            onChange={(event) => {
              if (isDemoOutcome(event.target.value)) setOutcome(event.target.value);
            }}
          >
            {OUTCOMES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {text.outcome[OUTCOME_LABEL[value]]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
    </FormDialog>
  );
}

export function FormSection() {
  const text = useMessages(kitMessageKey).form;
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // Each opening mounts a new window, so form state, the approval hold and server errors never leak into the next one.
  const [opening, setOpening] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  return (
    <KitSection title={text.title} description={text.description}>
      <Button
        variant="outline"
        onClick={() => {
          setOpening((count) => count + 1);
          setOpen(true);
        }}
      >
        {text.open}
      </Button>
      {submitted === null ? null : <p className="text-muted-foreground text-sm">{submitted}</p>}
      {attempts === 0 ? null : (
        <p data-testid="kit-attempts" className="text-muted-foreground text-sm">
          {format(text.attempts, locale, { count: attempts })}
        </p>
      )}
      <GuestWindow
        key={opening}
        text={text}
        open={open}
        onOpenChange={setOpen}
        onAttempt={() => setAttempts((count) => count + 1)}
        onAdded={(name) => setSubmitted(format(text.submitted, locale, { name }))}
      />
    </KitSection>
  );
}
