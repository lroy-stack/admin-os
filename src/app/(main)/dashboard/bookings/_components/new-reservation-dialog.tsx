"use client";

import { useId, useMemo, useRef, useState } from "react";

import { Controller, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { CHANNELS } from "@/core/channels";
import { format, formatCalendarDate, useLocale, useMessages } from "@/core/i18n/client";
import { SegmentedControl, type SegmentedOption } from "@/ds/components";
import { type CapabilityActionOptions, FormField, FormFooter, useCapabilityAction, useWindowForm } from "@/ds/forms";
import { FormDialog } from "@/ds/overlays";
import { ContactFields, type ContactFieldsProps, contactFieldsMessageKey, toCreateInput } from "@/modules/customers/ui";

import { createGuest, createReservation, findAvailability } from "../actions";
import { CoversStepper } from "./covers-stepper";
import type { TableLocation } from "./floor/floor-model";
import { zoneName } from "./floor/plan-names";
import { GuestPicker } from "./guest-picker";
import type { GuestRow } from "./guest-search";
import { bookingsMessageKey } from "./messages";
import {
  createdBooking,
  emptyReservation,
  type GuestMode,
  MAX_RESERVATION_COVERS,
  pointAtField,
  type ReservationFormInput,
  type ReservationFormValues,
  reservationFormSchema,
  toCreateBookingInput,
} from "./new-reservation-form";
import { fittingTables, slotOptions } from "./new-reservation-slots";
import { formatClock } from "./reservation-status";
import { SlotField } from "./slot-field";
import { useAvailability } from "./use-availability";
import type { ServiceDay } from "./view-model";
import { recordId } from "./walk-in-form";

/** What opened the window: the day and the party it starts from, and the opening (it remounts the window). */
export interface ReservationRequest {
  readonly date: string;
  readonly covers: number;
  readonly opening: number;
  readonly open: boolean;
}

interface ReservationContext {
  readonly locations: readonly TableLocation[];
  readonly service: ServiceDay;
  readonly errors: CapabilityActionOptions["errors"];
  /** Shows another business day, for the toast of a booking made on a day the screen is not showing. */
  readonly onShowDay: (day: string) => void;
}

/** The value of the "Automatic" choice; the form holds a blank table for it. */
const AUTOMATIC = "automatic";

function ReservationWindow({
  request,
  onOpenChange,
  context,
}: {
  request: ReservationRequest;
  onOpenChange: (open: boolean) => void;
  context: ReservationContext;
}) {
  const text = useMessages(bookingsMessageKey);
  const copy = text.newReservation;
  const fieldText = useMessages(contactFieldsMessageKey);
  const locale = useLocale();
  const { locations, service, errors, onShowDay } = context;
  const withErrors = errors === undefined ? {} : { errors };
  const makeGuest = useCapabilityAction(createGuest, withErrors);
  const book = useCapabilityAction(createReservation, withErrors);
  const [picked, setPicked] = useState<GuestRow | null>(null);
  // A contact created for a booking that then failed is reused on the retry, so the retry does not meet its own duplicate.
  const made = useRef<{ fingerprint: string; id: string } | null>(null);
  const guestName = useRef("");
  const coversLabel = useId();

  const schema = useMemo(
    () =>
      reservationFormSchema(
        {
          guestRequired: copy.guest.required,
          dateInvalid: copy.date.invalid,
          coversInvalid: copy.covers.invalid,
          slotRequired: copy.slot.required,
          noteTooLong: copy.note.tooLong,
          tagsInvalid: copy.tags.invalid,
        },
        fieldText.invalid,
      ),
    [copy, fieldText.invalid],
  );

  const windowForm = useWindowForm<ReservationFormInput, ReservationFormValues>(schema, {
    defaultValues: emptyReservation(request.date, request.covers),
    submit: async (values) => {
      let customerId: string;
      if (values.guest.kind === "existing") {
        customerId = values.guest.customerId;
        guestName.current = picked?.name ?? "";
      } else {
        const fingerprint = JSON.stringify(values.guest.contact);
        guestName.current = values.guest.contact.name;
        if (made.current?.fingerprint === fingerprint) {
          customerId = made.current.id;
        } else {
          const created = await makeGuest.run(toCreateInput(values.guest.contact));
          if (created?.status !== "ok") return created;
          const id = recordId(created.value);
          if (id === null) return { status: "error", text: copy.guest.searchFailed, code: "client.no_customer" };
          made.current = { fingerprint, id };
          customerId = id;
        }
      }
      return pointAtField(await book.run(toCreateBookingInput(values, customerId)));
    },
    onDone: (value) => {
      const booking = createdBooking(value);
      onOpenChange(false);
      if (booking === null) return;
      const message = format(copy.created, locale, {
        guest: guestName.current,
        party: format(text.party, locale, { count: booking.partySize }),
        time: formatClock(booking.startMin, locale),
      });
      if (booking.businessDay === service.businessDay) {
        toast.success(message);
        return;
      }
      const day = formatCalendarDate(booking.businessDay, locale, { weekday: "short", day: "numeric", month: "short" });
      toast.success(message, {
        action: { label: format(copy.showDay, locale, { day }), onClick: () => onShowDay(booking.businessDay) },
      });
    },
  });
  const { form } = windowForm;
  const [mode, date, covers, startMin, tableId] = useWatch({
    control: form.control,
    name: ["mode", "date", "covers", "startMin", "tableId"],
  });

  const availability = useAvailability(date, covers, findAvailability);
  const options = useMemo(
    () => (availability.status === "ready" ? slotOptions(availability.slots, date, service) : []),
    [availability, date, service],
  );
  const slot = options.find((option) => String(option.startMin) === startMin) ?? null;
  const fit = fittingTables(slot, locations);
  const modes: SegmentedOption<GuestMode>[] = [
    { value: "existing", label: copy.guest.existing },
    { value: "new", label: copy.guest.newContact },
  ];
  /** A new day or party offers other slots, so the slot and its table are chosen again. */
  const clearSlot = () => {
    form.setValue("startMin", "", { shouldDirty: true });
    form.setValue("tableId", "", { shouldDirty: true });
  };

  return (
    <FormDialog
      open={request.open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={copy.title}
      description={copy.description}
      footer={({ close }) => (
        <FormFooter
          verb={copy.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4 pt-1">
        <Controller
          control={form.control}
          name="mode"
          render={({ field }) => (
            <SegmentedControl
              label={copy.guest.label}
              value={field.value}
              options={modes}
              onValueChange={(next) => {
                field.onChange(next);
                form.clearErrors();
              }}
              className="w-fit"
            />
          )}
        />
        {mode === "existing" ? (
          <FormField
            control={form.control}
            name="customerId"
            label={copy.guest.searchLabel}
            readOnly={windowForm.awaiting}
          >
            {({ id, onChange, "aria-invalid": invalid, "aria-describedby": describedBy }) => (
              <GuestPicker
                id={id}
                aria-invalid={invalid}
                aria-describedby={describedBy}
                picked={picked}
                onPick={(row) => {
                  setPicked(row);
                  onChange(row.id);
                }}
                onClear={() => {
                  setPicked(null);
                  onChange("");
                }}
              />
            )}
          </FormField>
        ) : (
          <ContactFields
            // The form's values extend the contact's three text fields, which is all ContactFields reads.
            control={form.control as unknown as ContactFieldsProps["control"]}
            readOnly={windowForm.awaiting}
          />
        )}

        <FormField control={form.control} name="date" label={copy.date.label} readOnly={windowForm.awaiting}>
          {(field) => (
            <Input
              {...field}
              type="date"
              onChange={(event) => {
                field.onChange(event);
                clearSlot();
              }}
            />
          )}
        </FormField>

        <div className="flex flex-col gap-1.5">
          <span id={coversLabel} className="text-sm font-medium">
            {copy.covers.label}
          </span>
          <Controller
            control={form.control}
            name="covers"
            render={({ field }) => (
              <CoversStepper
                value={field.value}
                onChange={(next) => {
                  field.onChange(next);
                  clearSlot();
                }}
                max={MAX_RESERVATION_COVERS}
                labelledBy={coversLabel}
              />
            )}
          />
        </div>

        <FormField control={form.control} name="startMin" label={copy.slot.label} readOnly={windowForm.awaiting}>
          {({ id, value, onChange, "aria-invalid": invalid, "aria-describedby": describedBy }) => (
            <SlotField
              id={id}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              availability={availability}
              options={options}
              value={value}
              onChange={(next) => {
                onChange(next);
                form.setValue("tableId", "", { shouldDirty: true });
              }}
              onRetry={availability.retry}
              party={format(text.party, locale, { count: covers })}
            />
          )}
        </FormField>

        <FormField control={form.control} name="tableId" label={copy.table.label} readOnly={windowForm.awaiting}>
          {({ onChange, "aria-invalid": invalid, "aria-describedby": describedBy }) => (
            <TableChoices
              slotPicked={slot !== null}
              tables={fit}
              value={tableId}
              onChange={onChange}
              invalid={invalid}
              describedBy={describedBy}
            />
          )}
        </FormField>

        <FormField control={form.control} name="channel" label={copy.channel.label} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => (
            <NativeSelect {...field} disabled={readOnly} className="w-full">
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {text.channels[channel]}
                </option>
              ))}
            </NativeSelect>
          )}
        </FormField>

        <FormField control={form.control} name="note" label={copy.note.label} readOnly={windowForm.awaiting}>
          {(field) => <Textarea {...field} />}
        </FormField>

        <FormField
          control={form.control}
          name="tags"
          label={copy.tags.label}
          description={copy.tags.hint}
          readOnly={windowForm.awaiting}
        >
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
      </form>
    </FormDialog>
  );
}

/** "Automatic" or one of the tables that fit the slot, closest fit first: the list the form offers on every width. */
function TableChoices({
  slotPicked,
  tables,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  slotPicked: boolean;
  tables: readonly TableLocation[];
  value: string;
  onChange: (tableId: string) => void;
  invalid: boolean;
  describedBy: string | undefined;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  if (!slotPicked) return <p className="text-muted-foreground text-sm">{text.newReservation.table.needSlot}</p>;
  const selected = tables.some(({ table }) => table.id === value) ? value : AUTOMATIC;
  return (
    <div className="flex flex-col gap-2">
      <RadioGroup
        aria-label={text.newReservation.table.listLabel}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        value={selected}
        onValueChange={(next) => onChange(next === AUTOMATIC ? "" : next)}
        className="gap-1.5"
      >
        <TableChoice
          id={AUTOMATIC}
          label={text.newReservation.table.automatic}
          detail={text.newReservation.table.automaticHint}
        />
        {tables.map(({ table, zone }) => (
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
      {tables.length === 0 ? (
        <p className="text-muted-foreground text-sm">{text.newReservation.table.noneFree}</p>
      ) : null}
    </div>
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
 * The New reservation window (plan 003, B5, BK2): a guest (found by name or phone, or a new contact), a day, a party, a
 * time from `bookings.availability.get` and optionally a table. Saving calls `bookings.create`; a new contact is
 * created first with `customers.create`. The opener remounts it per opening, so every opening starts from its request.
 */
export function NewReservationDialog({
  request,
  onOpenChange,
  ...context
}: { request: ReservationRequest | null; onOpenChange: (open: boolean) => void } & ReservationContext) {
  return request === null ? null : (
    <ReservationWindow key={request.opening} request={request} onOpenChange={onOpenChange} context={context} />
  );
}
