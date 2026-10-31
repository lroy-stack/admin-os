import { Network, Printer, Volume2 } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getLocale, getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { format, formatDate, formatTime } from "@/core/i18n/client";

import { monitoringBundle, monitoringMessages } from "./_components/messages.server";
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
            <Tooltip>
              <TooltipTrigger aria-label={text.header.audioOn} className="inline-flex" type="button">
                <Volume2 aria-hidden="true" className="size-4" />
              </TooltipTrigger>
              <TooltipContent>{text.header.audioOn}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger aria-label={text.header.networkOn} className="inline-flex" type="button">
                <Network aria-hidden="true" className="size-4" />
              </TooltipTrigger>
              <TooltipContent>{text.header.networkOn}</TooltipContent>
            </Tooltip>
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
        <footer className="flex flex-wrap gap-2 p-2 *:data-[slot=button]:h-auto *:data-[slot=button]:min-h-11 *:data-[slot=button]:min-w-32 *:data-[slot=button]:flex-1 *:data-[slot=button]:rounded-none *:data-[slot=button]:py-1.5 *:data-[slot=button]:leading-tight *:data-[slot=button]:whitespace-normal">
          <Button variant="outline">{text.footer.mainScreen}</Button>
          <Button variant="outline">{text.footer.patientSetup}</Button>
          <Button variant="outline">{text.footer.alarmReview}</Button>
          <Button variant="outline">{text.footer.waveReview}</Button>
          <Button variant="outline">{text.footer.trends}</Button>
          <Button variant="outline">
            <Printer data-icon="inline-start" />
            {text.footer.print}
          </Button>
          <Button variant="outline">
            <Volume2 data-icon="inline-start" />
            {text.footer.silence}
          </Button>
          <Badge
            className="text-muted-foreground h-auto min-h-11 min-w-44 flex-1 rounded-none text-center whitespace-normal"
            variant="outline"
          >
            {format(text.header.device, locale, { device: DEVICE_CODE })}
          </Badge>
        </footer>
      </div>
    </LocaleBundles>
  );
}
