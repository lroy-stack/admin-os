import { cn } from "cn";

import { Badge } from "@/components/ui/badge";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { monitoringMessageKey } from "./messages";
import type { PatientRecord } from "./patient-localize";
import { usePatientWaveformSeries } from "./use-patient-vital-series";
import { VitalWaveform } from "./vital-waveform";

interface PatientCardProps {
  active: boolean;
  acknowledged: boolean;
  onSelect: (id: string) => void;
  patient: PatientRecord;
}

export function PatientCard({ active, acknowledged, onSelect, patient }: PatientCardProps) {
  const text = useMessages(monitoringMessageKey);
  const locale = useLocale();
  const hasActiveAlarm = patient.status === "alarm" && !acknowledged;
  const waveformSeries = usePatientWaveformSeries({ compact: true, kind: "ecg", patient });

  return (
    <button
      aria-label={format(text.openPatient, locale, { bed: patient.bed, name: patient.name })}
      aria-pressed={active}
      className={cn(
        "bg-card text-card-foreground flex min-h-36 min-w-0 flex-col p-2 text-left",
        "hover:bg-muted/50 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        active && "ring-primary ring-2 ring-inset",
      )}
      onClick={() => onSelect(patient.id)}
      type="button"
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="line-clamp-2 min-w-0 text-sm font-medium break-words" title={`${patient.bed} ${patient.name}`}>
          <span className={cn(hasActiveAlarm && "text-amber-500 dark:text-amber-400")}>{patient.bed}</span>{" "}
          {patient.name}
        </div>
        {hasActiveAlarm && patient.alarm && (
          <Badge
            className="h-auto max-w-[60%] shrink-0 rounded-none border-amber-500 text-[10px] break-words whitespace-normal text-amber-700 dark:border-amber-400 dark:text-amber-300"
            variant="outline"
          >
            {patient.alarm.badge}
          </Badge>
        )}
      </div>

      <div className="flex w-full flex-1 items-center">
        <VitalWaveform
          compact
          kind="ecg"
          showGrid={false}
          ariaLabel={format(text.aria.waveform, locale, { bed: patient.bed, trace: text.traces.ecgII })}
          {...waveformSeries}
        />
      </div>

      <dl className="divide-border mt-auto grid grid-cols-2 divide-x tabular-nums">
        <div className="min-w-0 pr-2">
          <dt className="text-xs text-lime-500 dark:text-lime-400">{text.vitals.hr}</dt>
          <dd
            className={cn(
              "text-right text-3xl leading-none font-medium text-lime-500 dark:text-lime-400",
              hasActiveAlarm && "text-amber-500 dark:text-amber-400",
            )}
          >
            {patient.heartRate}
          </dd>
        </div>
        <div className="min-w-0 pl-2">
          <dt className="text-xs text-cyan-500 dark:text-cyan-400">{text.vitals.spo2}</dt>
          <dd className="text-right text-3xl leading-none font-medium text-cyan-500 dark:text-cyan-400">
            {patient.spo2}
          </dd>
        </div>
      </dl>
    </button>
  );
}
