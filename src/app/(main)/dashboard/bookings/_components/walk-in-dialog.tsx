"use client";

import { useId, useState } from "react";

import { Controller, useWatch } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, type Locale, useLocale, useMessages } from "@/core/i18n/client";
import { useToastWithUndo } from "@/ds/feedback";
import { type CapabilityActionOptions, FormField, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { QuickDialog } from "@/ds/overlays";

import { seatWalkIn, undoWalkIn } from "../actions";
import { CoversStepper } from "./covers-stepper";
import type { TableLocation } from "./floor/floor-model";
import { zoneName } from "./floor/plan-names";
import { formatDuration } from "./floor/table-state";
import { type BookingsMessages, bookingsMessageKey } from "./messages";
import { formatClock } from "./reservation-status";
import type { Reservation, ServiceDay } from "./view-model";
import { seatedBookingId, toSeatInput, type WalkInFormValues, walkInFormSchema } from "./walk-in-form";
import { MAX_WALK_IN_COVERS, selectedTableId, type WalkInOptions, walkInOptions } from "./walk-in-options";

/** What opened the window: a count, a table to preset when it came from a free table's callout, and the opening. */
export interface WalkInRequest {
  readonly covers: number;
  readonly tableId: string | null;
  /** Remounts the window, so every opening starts clean. */
  readonly opening: number;
  readonly open: boolean;
}

interface WalkInContext {
  readonly locations: readonly TableLocation[];
  readonly reservations: readonly Reservation[];
  readonly service: ServiceDay;
  readonly errors: CapabilityActionOptions["errors"];
}

type NoOptions = Exclude<WalkInOptions<TableLocation>, { kind: "fits" }>;

/** Why no table is offered, and the next table to free up with a note on the wait to quote the party. */
function NoTable({ options, covers, service }: { options: NoOptions; covers: number; service: ServiceDay }) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const party = format(text.party, locale, { count: covers });

  return (
    <Alert>
      <AlertTitle>{format(text.walkIn.noneTitle, locale, { party })}</AlertTitle>
      <AlertDescription>
        <WhyNone options={options} party={party} service={service} text={text} locale={locale} />
      </AlertDescription>
    </Alert>
  );
}

function WhyNone({
  options,
  party,
  service,
  text,
  locale,
}: {
  options: NoOptions;
  party: string;
  service: ServiceDay;
  text: BookingsMessages;
  locale: Locale;
}) {
  if (options.kind === "too_big") {
    return options.largest === 0
      ? text.walkIn.noTables
      : format(text.walkIn.tooBig, locale, {
          party,
          seats: format(text.seats, locale, { count: options.largest }),
        });
  }
  if (options.next === null) return format(text.walkIn.takenAllNight, locale, { party });
  return (
    <>
      {format(text.walkIn.takenUntil, locale, { party, time: formatClock(options.next.atMin, locale) })}{" "}
      {format(text.walkIn.frees, locale, {
        table: options.next.location.table.label,
        wait: formatDuration(options.next.atMin - service.nowMin, text.duration, locale),
      })}
    </>
  );
}

/** The window and its form. The opener remounts it per opening, so every opening starts from its request. */
function WalkInWindow({
  request,
  onOpenChange,
  onSeated,
  context,
}: {
  request: WalkInRequest;
  onOpenChange: (open: boolean) => void;
  onSeated: (bookingId: string, tableLabel: string) => void;
  context: WalkInContext;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const { locations, reservations, service, errors } = context;
  const schema = walkInFormSchema(text.walkIn);
  const seat = useCapabilityAction(seatWalkIn, errors === undefined ? {} : { errors });
  const [chosen, setChosen] = useState<string | null>(request.tableId);
  const coversLabel = useId();

  const windowForm = useWindowForm<WalkInFormValues, WalkInFormValues>(schema, {
    defaultValues: { covers: request.covers, name: "" },
    submit: (values) => {
      if (tableId === null) {
        return Promise.resolve({ status: "error", text: text.walkIn.noTables, code: "client.no_table" } as const);
      }
      return seat.run(toSeatInput(values, tableId));
    },
    onDone: (value) => {
      const id = seatedBookingId(value);
      const label = locations.find(({ table }) => table.id === tableId)?.table.label ?? "";
      onOpenChange(false);
      if (id !== null) onSeated(id, label);
    },
  });
  const { form } = windowForm;
  const covers: number = useWatch({ control: form.control, name: "covers" });

  const options: WalkInOptions<TableLocation> = walkInOptions({
    locations,
    reservations,
    covers,
    nowMin: service.nowMin,
    stayMin: service.walkInStayMin,
  });
  const tableId: string | null = selectedTableId(options, chosen);

  return (
    <QuickDialog
      open={request.open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={text.walkIn.title}
      description={text.walkIn.description}
      footer={({ close }) =>
        options.kind === "fits" ? (
          <FormFooter
            verb={format(text.callout.seat, locale, { count: covers })}
            formId={windowForm.formProps.id}
            pending={windowForm.pending}
            error={windowForm.formError}
            onCancel={close}
          />
        ) : (
          <Button type="button" variant="outline" onClick={close}>
            {text.walkIn.close}
          </Button>
        )
      }
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span id={coversLabel} className="text-sm font-medium">
            {text.walkIn.covers}
          </span>
          <Controller
            control={form.control}
            name="covers"
            render={({ field }) => (
              <CoversStepper
                value={field.value}
                onChange={field.onChange}
                max={MAX_WALK_IN_COVERS}
                labelledBy={coversLabel}
              />
            )}
          />
        </div>

        {options.kind === "fits" ? (
          <>
            {request.tableId !== null && !options.tables.some(({ table }) => table.id === request.tableId) ? (
              <p className="text-muted-foreground text-sm">
                {format(text.walkIn.presetBusy, locale, {
                  table: locations.find(({ table }) => table.id === request.tableId)?.table.label ?? request.tableId,
                })}
              </p>
            ) : null}
            <RadioGroup
              aria-label={text.walkIn.tables}
              value={tableId ?? ""}
              onValueChange={setChosen}
              className="gap-1.5"
            >
              {options.tables.map(({ table, zone }) => (
                <TableChoice
                  key={table.id}
                  id={table.id}
                  label={table.label}
                  detail={format(text.callout.seatsInZone, locale, {
                    seats: format(text.seats, locale, { count: table.capacity }),
                    zone: zoneName(zone, text.venue),
                  })}
                />
              ))}
            </RadioGroup>
            <FormField control={form.control} name="name" label={text.walkIn.name} readOnly={windowForm.awaiting}>
              {(field) => <Input {...field} autoComplete="off" />}
            </FormField>
          </>
        ) : (
          <NoTable options={options} covers={covers} service={service} />
        )}
      </form>
    </QuickDialog>
  );
}

function TableChoice({ id, label, detail }: { id: string; label: string; detail: string }) {
  const inputId = useId();
  return (
    <Label
      htmlFor={inputId}
      className="has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2"
    >
      <RadioGroupItem id={inputId} value={id} />
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground text-xs font-normal">{detail}</span>
    </Label>
  );
}

/**
 * The Walk-in window (plan 003, B4, BK1 and BK3): the header button and a free table's callout open this same window,
 * the callout presetting the table and the covers. Seating calls `bookings.walk_in.seat`; on success the window closes
 * and a toast offers Undo, which calls `bookings.walk_in.undo`.
 */
export function WalkInDialog({
  request,
  onOpenChange,
  ...context
}: { request: WalkInRequest | null; onOpenChange: (open: boolean) => void } & WalkInContext) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const undo = useCapabilityAction(undoWalkIn, context.errors === undefined ? {} : { errors: context.errors });
  const toastWithUndo = useToastWithUndo();

  const onSeated = (bookingId: string, tableLabel: string) => {
    toastWithUndo({
      message: format(text.walkIn.seated, locale, { table: tableLabel }),
      undo: async () => {
        const outcome = await undo.run({ id: bookingId });
        if (outcome?.status !== "ok") throw new Error("walk-in undo refused");
      },
    });
  };

  return request === null ? null : (
    <WalkInWindow
      key={request.opening}
      request={request}
      onOpenChange={onOpenChange}
      onSeated={onSeated}
      context={context}
    />
  );
}
