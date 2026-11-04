import { LocaleBundles } from "@/app/_components/locale-root";
import { Separator } from "@/components/ui/separator";
import { getLocale, getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { format, formatDate, formatTime } from "@/core/i18n/client";

import { monitoringBundle, monitoringMessages } from "./_components/messages.server";
import { MonitoringFooter, MonitoringProvider, StatusIcons } from "./_components/monitoring-provider";
import { localizePatients } from "./_components/patient-localize";
import { PatientMonitoring } from "./_components/patient-monitoring";

export const generateMetadata = () => pageMetadata("/dashboard/patient-monitoring", monitoringMessages);

/** The demo clock reads UTC: the template has no business time zone to show. */
const CLOCK_ZONE = "UTC";
/** The bedside device the footer reports as connected. */
const DEVICE_CODE = "C04";

export default async function Page() {
  const [locale, text] = await Promise.all([getLocale(), getMessages(monitoringMessages)]);
  const patients = localizePatients(locale, text);
  const now = new Date();

  return (
    <LocaleBundles bundles={[monitoringBundle]}>
      <MonitoringProvider>
        <div
          className="flex min-h-[calc(100svh-var(--dashboard-header-height))] min-w-0 flex-col"
          data-content-padding="false"
        >
          <div className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-2 py-2 text-sm lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:py-0">
            <div className="min-w-0 break-words uppercase">{text.header.title}</div>
            <div className="whitespace-nowrap">{format(text.header.patients, locale, { count: patients.length })}</div>
            <div className="text-muted-foreground col-span-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 lg:col-span-1 lg:justify-end">
              <span className="flex gap-3 whitespace-nowrap tabular-nums">
                <span>{formatDate(now, locale, CLOCK_ZONE, { day: "2-digit", month: "short", year: "numeric" })}</span>
                <span>
                  {formatTime(now, locale, CLOCK_ZONE, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hourCycle: "h23",
                  })}
                </span>
              </span>
              <StatusIcons />
            </div>
          </div>
          <Separator />

          {/*
          data.ts holds the patients and PatientMonitoring renders the screen.
          use-patient-vital-series.ts repeats templates from waveform-data.ts,
          while use-realtime-tick.ts and realtime-utils.ts move the charts.
        */}
          <PatientMonitoring patients={patients} />

          <Separator />
          <MonitoringFooter device={DEVICE_CODE} />
        </div>
      </MonitoringProvider>
    </LocaleBundles>
  );
}
