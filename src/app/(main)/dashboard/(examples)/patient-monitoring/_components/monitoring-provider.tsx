"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import { Network, Printer, Volume2, VolumeX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { monitoringMessageKey } from "./messages";

const TABS = ["events", "trends"] as const;
type MonitorTab = (typeof TABS)[number];

export const isTab = (value: string): value is MonitorTab => TABS.some((tab) => tab === value);

interface Monitoring {
  readonly tab: MonitorTab;
  readonly setTab: (tab: MonitorTab) => void;
  /** The alarm audio is silenced: the header icon says so. Demo-local, nothing is muted anywhere. */
  readonly muted: boolean;
  readonly toggleMuted: () => void;
}

const MonitoringContext = createContext<Monitoring | null>(null);

export function useMonitoring(): Monitoring {
  const value = useContext(MonitoringContext);
  if (!value) throw new Error("useMonitoring needs a MonitoringProvider above it");
  return value;
}

/** The selected tab and the silenced state, shared by the monitor, the header icons and the footer buttons. */
export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<MonitorTab>("trends");
  const [muted, setMuted] = useState(false);
  return (
    <MonitoringContext.Provider value={{ tab, setTab, muted, toggleMuted: () => setMuted((current) => !current) }}>
      {children}
    </MonitoringContext.Provider>
  );
}

/** The header's audio and network icons; the audio one follows Silence. */
export function StatusIcons() {
  const text = useMessages(monitoringMessageKey).header;
  const { muted } = useMonitoring();
  const AudioIcon = muted ? VolumeX : Volume2;
  const audio = muted ? text.audioOff : text.audioOn;

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          aria-label={audio}
          className="inline-flex"
          data-inert-reason="A tooltip target: the status opens on hover and focus, not on press."
          type="button"
        >
          <AudioIcon aria-hidden="true" className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{audio}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          aria-label={text.networkOn}
          className="inline-flex"
          data-inert-reason="A tooltip target: the status opens on hover and focus, not on press."
          type="button"
        >
          <Network aria-hidden="true" className="size-4" />
        </TooltipTrigger>
        <TooltipContent>{text.networkOn}</TooltipContent>
      </Tooltip>
    </>
  );
}

/** Trends opens the Trends tab, Print prints the page, Silence silences the alarm audio of the demo. */
export function MonitoringFooter({ device }: { device: string }) {
  const text = useMessages(monitoringMessageKey);
  const locale = useLocale();
  const { setTab, muted, toggleMuted } = useMonitoring();

  return (
    <footer className="flex flex-wrap gap-2 p-2 *:data-[slot=button]:h-auto *:data-[slot=button]:min-h-11 *:data-[slot=button]:min-w-32 *:data-[slot=button]:flex-1 *:data-[slot=button]:rounded-none *:data-[slot=button]:py-1.5 *:data-[slot=button]:leading-tight *:data-[slot=button]:whitespace-normal">
      <Button variant="outline" onClick={() => setTab("trends")}>
        {text.footer.trends}
      </Button>
      <Button
        variant="outline"
        data-inert-reason="Opens the browser print dialog, which the dead-click sweep cannot observe."
        onClick={() => window.print()}
      >
        <Printer data-icon="inline-start" />
        {text.footer.print}
      </Button>
      <Button variant="outline" aria-pressed={muted} onClick={toggleMuted}>
        <VolumeX data-icon="inline-start" />
        {text.footer.silence}
      </Button>
      <Badge
        className="text-muted-foreground h-auto min-h-11 min-w-44 flex-1 rounded-none text-center whitespace-normal"
        variant="outline"
      >
        {format(text.header.device, locale, { device })}
      </Badge>
    </footer>
  );
}
