"use client";

import { Fragment, useState } from "react";

import { cn } from "cn";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { monitoringMessageKey } from "./messages";
import { PatientCard } from "./patient-card";
import { PatientDetail } from "./patient-detail";
import type { PatientRecord } from "./patient-localize";
import { PatientTrends } from "./patient-trends";

const DISCLOSURE_HOURS = 24;

interface PatientMonitoringProps {
  patients: PatientRecord[];
}

export function PatientMonitoring({ patients }: PatientMonitoringProps) {
  const text = useMessages(monitoringMessageKey);
  const locale = useLocale();
  const [selectedPatientId, setSelectedPatientId] = useState("cardiac-04");
  const [acknowledgedPatientIds, setAcknowledgedPatientIds] = useState<string[]>([]);
  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? patients[0];
  const acknowledged = acknowledgedPatientIds.includes(selectedPatient.id);
  const hasActiveAlarm = selectedPatient.status === "alarm" && !acknowledged;

  function acknowledgePatient(patientId: string) {
    setAcknowledgedPatientIds((current) => (current.includes(patientId) ? current : [...current, patientId]));
  }

  return (
    <div className="grid min-w-0 flex-1 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <div className="*:border-border grid grid-cols-2 content-start *:border-r *:border-b *:even:border-r-0">
        {patients.map((patient) => (
          <PatientCard
            acknowledged={acknowledgedPatientIds.includes(patient.id)}
            active={patient.id === selectedPatient.id}
            key={patient.id}
            onSelect={setSelectedPatientId}
            patient={patient}
          />
        ))}
      </div>

      <div className="border-border flex min-w-0 flex-col lg:border-l">
        <div className="bg-muted/50 flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1">
          <div className="flex min-w-0 items-center gap-3 font-medium">
            <Badge className="rounded-none" variant="outline">
              {selectedPatient.bed}
            </Badge>
            <span className="min-w-0 text-lg break-words">{selectedPatient.name}</span>
          </div>
          <div className="text-muted-foreground min-w-0 text-sm break-words hyphens-auto">
            {format(text.patientLine, locale, {
              age: selectedPatient.age,
              sex: selectedPatient.sexLabel,
              diagnosis: selectedPatient.diagnosis,
            })}
          </div>
        </div>
        <Separator />

        {selectedPatient.alarm && (
          <Alert
            className={cn(
              "min-h-9 rounded-none border-x-0 border-t-0 pr-36",
              hasActiveAlarm
                ? "border-amber-500 bg-amber-400 text-amber-950"
                : "border-border bg-muted text-foreground",
            )}
            variant="default"
          >
            <AlertTitle>{selectedPatient.alarm.text}</AlertTitle>
            <AlertDescription className={cn(hasActiveAlarm && "text-amber-950")}>
              {selectedPatient.alarm.activeFor}
            </AlertDescription>
            <AlertAction className="top-1/2 -translate-y-1/2">
              <Button
                className="rounded-none"
                disabled={acknowledged}
                onClick={() => acknowledgePatient(selectedPatient.id)}
                size="sm"
                variant="secondary"
              >
                {acknowledged ? text.alarm.acknowledged : text.alarm.acknowledge}
              </Button>
            </AlertAction>
          </Alert>
        )}

        <PatientDetail hasActiveAlarm={hasActiveAlarm} patient={selectedPatient} />

        <Tabs className="min-h-0 flex-1 gap-0" defaultValue="trends">
          <TabsList
            className="*:border-border w-full justify-start gap-0 overflow-x-auto border-b p-0 *:h-full *:flex-none *:rounded-none *:border-0 *:border-r *:px-3 *:after:-bottom-px!"
            variant="line"
          >
            <TabsTrigger value="real-time">{text.tabs.realTime}</TabsTrigger>
            <TabsTrigger value="events">{text.tabs.events}</TabsTrigger>
            <TabsTrigger value="trends">{text.tabs.trends}</TabsTrigger>
            <TabsTrigger value="disclosure">{text.tabs.disclosure}</TabsTrigger>
          </TabsList>

          <TabsContent
            className="m-0 flex flex-col items-center justify-center gap-1 px-4 text-center"
            value="real-time"
          >
            <p className="text-sm font-medium">{text.realTime.title}</p>
            <p className="text-muted-foreground text-xs">{text.realTime.description}</p>
          </TabsContent>
          <TabsContent className="m-0" value="events">
            <div className="min-h-44">
              <div className="bg-muted/40 text-muted-foreground grid grid-cols-[4rem_minmax(0,1fr)] px-4 py-2 text-xs font-medium">
                <span>{text.events.time}</span>
                <span>{text.events.event}</span>
              </div>
              <Separator />
              {selectedPatient.recentEvents.map((event, index) => (
                <Fragment key={`${event.time}-${event.label}`}>
                  <div className="grid min-h-11 grid-cols-[4rem_minmax(0,1fr)] items-center px-4 py-2 text-sm">
                    <span className="text-muted-foreground tabular-nums">{event.time}</span>
                    <span className="min-w-0 break-words hyphens-auto">{event.label}</span>
                  </div>
                  {index < selectedPatient.recentEvents.length - 1 && <Separator />}
                </Fragment>
              ))}
            </div>
          </TabsContent>
          <TabsContent className="m-0" value="trends">
            <PatientTrends patient={selectedPatient} />
          </TabsContent>
          <TabsContent
            className="m-0 flex flex-col items-center justify-center gap-1 px-4 text-center"
            value="disclosure"
          >
            <p className="text-sm font-medium">{text.disclosure.title}</p>
            <p className="text-muted-foreground text-xs">
              {format(text.disclosure.description, locale, { hours: DISCLOSURE_HOURS })}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
