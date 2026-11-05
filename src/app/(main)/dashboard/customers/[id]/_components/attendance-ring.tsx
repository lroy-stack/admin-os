import type { ReactNode } from "react";

import { format, type Locale } from "@/core/i18n/client";

import type { CustomerRecordMessages } from "./messages";
import type { Attendance } from "./record-model";

interface AttendanceRingProps {
  /** Null when nothing was ever booked: the avatar is then drawn without a ring. */
  attendance: Attendance | null;
  text: CustomerRecordMessages["header"];
  locale: Locale;
  children: ReactNode;
}

/** The avatar inside a ring of kept visits over booked visits, with the same figures as a sentence for screen readers. */
export function AttendanceRing({ attendance, text, locale, children }: AttendanceRingProps) {
  return (
    <div className="grid size-18 shrink-0 place-items-center sm:size-23">
      {attendance !== null && (
        <>
          <span className="sr-only">
            {format(text.attendance, locale, { kept: attendance.kept, count: attendance.booked })}
          </span>
          <svg aria-hidden="true" className="col-start-1 row-start-1 size-full -rotate-90" viewBox="0 0 100 100">
            <circle className="stroke-foreground/10 fill-none" cx="50" cy="50" r="46" strokeWidth="2.5" />
            {attendance.kept > 0 && (
              <circle
                className="stroke-brand fill-none"
                cx="50"
                cy="50"
                pathLength="100"
                r="46"
                strokeDasharray={`${attendance.ratio * 100} 100`}
                strokeLinecap="round"
                strokeWidth="2.5"
              />
            )}
          </svg>
        </>
      )}
      <div className="col-start-1 row-start-1">{children}</div>
    </div>
  );
}
