import { cn } from "cn";

import { format, useLocale, useMessages } from "@/core/i18n/client";

import { monitoringMessageKey } from "./messages";
import type { PatientRecord } from "./patient-localize";
import { type EcgLead, usePatientWaveformSeries } from "./use-patient-vital-series";
import { formatLimits, unitSymbol } from "./vital-format";
import { VitalWaveform, type WaveformKind } from "./vital-waveform";

interface PatientDetailProps {
  hasActiveAlarm: boolean;
  patient: PatientRecord;
}

interface TraceRowProps {
  /** Measuring scale of the trace, for example paper speed and gain; technical notation, the same in every language. */
  calibration?: string;
  kind: WaveformKind;
  label: string;
  lead?: EcgLead;
  patient: PatientRecord;
}

function TraceRow({ calibration, kind, label, lead, patient }: TraceRowProps) {
  const text = useMessages(monitoringMessageKey);
  const locale = useLocale();
  const series = usePatientWaveformSeries({ kind, lead, patient });

  return (
    <div className="border-border grid min-h-16 grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] border-b">
      <div className="flex min-w-0 flex-col gap-0.5 px-3 py-2">
        <span
          className={cn(
            "text-sm font-medium break-words",
            kind === "ecg" && "text-lime-500 dark:text-lime-400",
            kind === "pleth" && "text-cyan-500 dark:text-cyan-400",
            kind === "respiration" && "text-amber-500 dark:text-amber-400",
            kind === "arterial" && "text-red-500 dark:text-red-400",
          )}
        >
          {label}
        </span>
        {calibration && <span className="text-muted-foreground text-[10px] break-words">{calibration}</span>}
      </div>
      <VitalWaveform
        ariaLabel={format(text.aria.waveform, locale, { bed: patient.bed, trace: label })}
        kind={kind}
        showGrid
        {...series}
      />
    </div>
  );
}

function NumericVital({
  color,
  label,
  limits,
  unit,
  value,
}: {
  color: string;
  label: string;
  limits: string;
  unit: string;
  value: number | string;
}) {
  return (
    <div className="border-border grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-3 py-1">
      <div className="min-w-0">
        <div className={cn("text-sm font-medium break-words", color)}>{label}</div>
        <div className="text-muted-foreground text-[10px] tabular-nums">{limits}</div>
      </div>
      <div
        className={cn(
          "flex shrink-0 items-baseline gap-0.5 text-right text-4xl leading-none font-medium tabular-nums",
          color,
        )}
      >
        {value} <span className="text-xs">{unit}</span>
      </div>
    </div>
  );
}

export function PatientDetail({ hasActiveAlarm, patient }: PatientDetailProps) {
  const text = useMessages(monitoringMessageKey);
  const locale = useLocale();
  const limits = (min: number, max: number, digits = 0) => formatLimits(text.range, locale, min, max, digits);

  return (
    <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_15.5rem]">
      <div className="border-border xl:after:border-border min-w-0 after:hidden xl:grid xl:grid-rows-6 xl:border-r xl:after:block xl:after:border-b">
        <TraceRow calibration={text.calibration.ecg} kind="ecg" label={text.traces.ecgII} lead="II" patient={patient} />
        <TraceRow calibration={text.calibration.ecg} kind="ecg" label={text.traces.ecgV5} lead="V5" patient={patient} />
        <TraceRow kind="pleth" label={text.traces.pleth} patient={patient} />
        <TraceRow
          calibration={text.calibration.respiration}
          kind="respiration"
          label={text.traces.resp}
          patient={patient}
        />
        <TraceRow calibration={text.units.pressure} kind="arterial" label={text.traces.art} patient={patient} />
      </div>

      <dl className="xl:grid xl:grid-rows-6">
        <NumericVital
          color={hasActiveAlarm ? "text-amber-500 dark:text-amber-400" : "text-lime-500 dark:text-lime-400"}
          label={text.vitals.hr}
          limits={limits(50, 100)}
          unit={text.units.heartRate}
          value={patient.heartRate}
        />
        <NumericVital
          color="text-cyan-500 dark:text-cyan-400"
          label={text.vitals.spo2}
          limits={limits(92, 100)}
          unit={unitSymbol("percent", locale)}
          value={patient.spo2}
        />
        <NumericVital
          color="text-amber-500 dark:text-amber-400"
          label={text.vitals.rr}
          limits={limits(8, 30)}
          unit={text.units.respiration}
          value={patient.respirationRate}
        />
        <NumericVital
          color="text-foreground"
          label={text.vitals.nibp}
          limits={limits(90, 160)}
          unit={`(${patient.map})`}
          value={patient.nibp}
        />
        <NumericVital
          color="text-red-500 dark:text-red-400"
          label={text.vitals.art}
          limits={limits(80, 140)}
          unit={`(${patient.arterialMap})`}
          value={patient.arterialPressure}
        />
        <NumericVital
          color="text-foreground"
          label={text.vitals.temp}
          limits={limits(36, 38, 1)}
          unit={unitSymbol("celsius", locale)}
          value={patient.temperature}
        />
      </dl>
    </div>
  );
}
