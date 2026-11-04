"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { formatAmount, useCurrency, useLocale, useMessages } from "@/core/i18n/client";
import { QuickDialog } from "@/ds/overlays";

import { useOpenWindow } from "../../_components/use-open-window";
import { financeMessageKey } from "./messages";
import { parseTransferAmount } from "./quick-transfer";

type Step = "review" | "done";

interface QuickTransferFormProps {
  symbol: string;
  currency: string;
  placeholder: string;
}

/**
 * The quick transfer: Send opens a `QuickDialog` that reviews the amount, then a confirmation. Demo-only: nothing is
 * sent anywhere, and the window says so.
 */
export function QuickTransferForm({ symbol, currency, placeholder }: QuickTransferFormProps) {
  const text = useMessages(financeMessageKey);
  const locale = useLocale();
  const businessCurrency = useCurrency();
  const errorId = useId();
  const review = useOpenWindow<number>();
  const [typed, setTyped] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [step, setStep] = useState<Step>("review");

  const send = (opener: Element) => {
    const amount = parseTransferAmount(typed);
    setInvalid(amount === null);
    if (amount === null) return;
    setStep("review");
    review.show(amount, opener);
  };

  return (
    <>
      <Field orientation="horizontal" data-invalid={invalid}>
        <InputGroup>
          <InputGroupAddon>
            <InputGroupText>{symbol}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            aria-label={text.quick.amountLabel}
            aria-invalid={invalid}
            aria-describedby={invalid ? errorId : undefined}
            inputMode="decimal"
            placeholder={placeholder}
            value={typed}
            onChange={(event) => {
              setTyped(event.target.value);
              setInvalid(false);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") send(event.currentTarget);
            }}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupText>{currency}</InputGroupText>
          </InputGroupAddon>
        </InputGroup>
        <Button className="shrink-0" onClick={(event) => send(event.currentTarget)}>
          {text.quick.send}
        </Button>
      </Field>
      {invalid ? (
        <FieldError id={errorId} className="mt-2">
          {text.transfer.invalid}
        </FieldError>
      ) : null}

      {review.shown ? (
        <QuickDialog
          demo
          key={review.shown.opening}
          open={review.shown.open}
          onOpenChange={review.onOpenChange}
          title={step === "review" ? text.transfer.title : text.transfer.doneTitle}
          description={step === "review" ? text.transfer.description : text.transfer.doneBody}
          returnFocus={review.returnFocus}
          footer={({ close }) =>
            step === "review" ? (
              <>
                <Button type="button" variant="outline" onClick={close}>
                  {text.cancel}
                </Button>
                <Button type="button" onClick={() => setStep("done")}>
                  {text.transfer.confirm}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setTyped("");
                  close();
                }}
              >
                {text.done}
              </Button>
            )
          }
        >
          <dl className="divide-y rounded-lg border text-sm">
            <div className="flex items-center justify-between gap-4 px-3 py-2">
              <dt className="text-muted-foreground">{text.transfer.amount}</dt>
              <dd className="font-medium tabular-nums">{formatAmount(review.shown.value, businessCurrency, locale)}</dd>
            </div>
          </dl>
        </QuickDialog>
      ) : null}
    </>
  );
}
