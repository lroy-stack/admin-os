import type { ReactNode } from "react";

import type { Locale } from "@/core/i18n/client";
import { format } from "@/core/i18n/client";

import { CustomerAvatar } from "../../_components/customer-card";
import type { CustomerRow } from "../../_components/directory-model";
import { AttendanceRing } from "./attendance-ring";
import { RecordTags } from "./directory-pieces";
import type { CustomerRecordMessages } from "./messages";
import type { Attendance } from "./record-model";

interface RecordHeaderProps {
  customer: CustomerRow;
  blockReason: string | undefined;
  attendance: Attendance | null;
  text: CustomerRecordMessages["header"];
  locale: Locale;
  /** The write controls the actor may use with the contact links (`RecordActions`), in one wrapping row. */
  actions: ReactNode;
}

/** Identity and state: the avatar in its attendance ring, the name, the pills, the reason for a block and the contact links. */
export function RecordHeader({ customer, blockReason, attendance, text, locale, actions }: RecordHeaderProps) {
  return (
    <div className="flex flex-col gap-5 px-4 md:px-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <AttendanceRing attendance={attendance} text={text} locale={locale}>
          <CustomerAvatar
            customer={customer}
            className="size-16 sm:size-20 [&_[data-slot=avatar-fallback]]:text-lg sm:[&_[data-slot=avatar-fallback]]:text-xl"
          />
        </AttendanceRing>

        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="font-heading text-xl leading-6 font-semibold tracking-tight break-words sm:text-2xl sm:leading-7">
            {customer.name}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <RecordTags customer={customer} />
          </div>
          {customer.blocked && blockReason !== undefined && (
            <p className="text-muted-foreground text-sm break-words">
              {format(text.blockedReason, locale, { reason: blockReason })}
            </p>
          )}
        </div>
      </div>

      {actions}
    </div>
  );
}
