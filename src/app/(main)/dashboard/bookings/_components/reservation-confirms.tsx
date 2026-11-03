"use client";

import type { RefObject } from "react";

import { toast } from "sonner";
import { z } from "zod";

import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useCapabilityAction } from "@/ds/forms";
import { ConfirmAction, type ConfirmOutcome } from "@/ds/overlays";

import { cancelBooking, markNoShow } from "../actions";
import { useBookingWrites } from "./booking-writes";
import { bookingsMessageKey } from "./messages";
import { guestName } from "./reservation-status";
import type { Reservation } from "./view-model";

export type PendingConfirm = "cancel" | "no_show";

/** The longest reason the capabilities accept. */
const REASON_MAX = 500;

/**
 * The two destructive actions of a reservation (ADR 0015): each runs only from a `ConfirmAction`. Cancelling needs a
 * reason; a no-show may carry one. Neither is optimistic: the window shows its pending state and the server's text on
 * failure, and the page refreshes on success.
 */
export function ReservationConfirms({
  reservation,
  confirming,
  onClose,
  returnFocus,
}: {
  reservation: Reservation;
  confirming: PendingConfirm | null;
  onClose: () => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const { errors } = useBookingWrites();
  const options = errors === undefined ? {} : { errors };
  const cancel = useCapabilityAction(cancelBooking, options);
  const noShow = useCapabilityAction(markNoShow, options);
  const guest = guestName(reservation, text);
  const busy: ConfirmOutcome = { status: "error", text: text.writes.failed, code: "client.busy" };

  return (
    <>
      <ConfirmAction
        open={confirming === "cancel"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        verb={text.writes.cancel.verb}
        title={text.writes.cancel.title}
        consequence={format(text.writes.cancel.consequence, locale, { guest })}
        cancelLabel={text.writes.cancel.keep}
        destructive
        returnFocus={returnFocus}
        reason={{
          label: text.writes.cancel.reasonLabel,
          schema: z
            .string()
            .trim()
            .min(1, text.writes.cancel.reasonRequired)
            .max(REASON_MAX, text.writes.cancel.reasonTooLong),
        }}
        onConfirm={async (reason) => {
          const outcome = await cancel.run({ id: reservation.id, reason });
          if (outcome?.status === "ok") toast.success(text.writes.cancel.done);
          return outcome ?? busy;
        }}
      />
      <ConfirmAction
        open={confirming === "no_show"}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        verb={text.writes.noShow.verb}
        title={text.writes.noShow.title}
        consequence={format(text.writes.noShow.consequence, locale, { guest })}
        cancelLabel={text.writes.noShow.keep}
        destructive
        returnFocus={returnFocus}
        reason={{
          label: text.writes.noShow.reasonLabel,
          schema: z.string().trim().max(REASON_MAX, text.writes.noShow.reasonTooLong),
        }}
        onConfirm={async (reason) => {
          const outcome = await noShow.run({ id: reservation.id, ...(reason ? { reason } : {}) });
          if (outcome?.status === "ok") toast.success(text.writes.noShow.done);
          return outcome ?? busy;
        }}
      />
    </>
  );
}
