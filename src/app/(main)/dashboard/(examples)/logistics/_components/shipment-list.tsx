import { type CSSProperties, useId, useState } from "react";

import { cn } from "cn";
import { Plane, Search, Ship, SlidersHorizontal, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, useLocale, useMessages } from "@/core/i18n/client";
import { PopoverOrSheet } from "@/ds/overlays";

import { logisticsMessageKey } from "./messages";
import { shipmentTotals } from "./shipment-data";
import {
  filterShipments,
  type ModeFilter,
  modeFilters,
  noShipmentFilter,
  type ShipmentTab,
  shipmentTabs,
} from "./shipment-filter";
import type { Shipment } from "./shipment-localize";

const modeIcons = {
  air: Plane,
  land: Truck,
  sea: Ship,
} as const;

const progressRingClasses: Record<Shipment["status"], string> = {
  scheduled: "text-muted-foreground",
  inTransit: "text-primary",
  outForDelivery: "text-primary",
  delivered: "text-green-600",
  delayed: "text-destructive",
  onHold: "text-amber-500",
  customsHold: "text-amber-500",
};

function getProgressRingClass(status: Shipment["status"]) {
  return cn(
    "grid size-3 shrink-0 place-items-center rounded-full bg-[conic-gradient(currentColor_0deg_var(--angle),transparent_var(--angle)_360deg)] p-[0.5px]",
    progressRingClasses[status],
  );
}

type ShipmentCardProps = {
  active?: boolean;
  onSelectShipment: (shipmentId: Shipment["id"]) => void;
  shipment: Shipment;
};

type ShipmentListProps = {
  onSelectShipment: (shipmentId: Shipment["id"]) => void;
  selectedShipmentId: Shipment["id"] | null;
  shipments: Shipment[];
};

function ShipmentCard({ shipment, active, onSelectShipment }: ShipmentCardProps) {
  const messages = useMessages(logisticsMessageKey);
  const text = messages.list;
  const locale = useLocale();
  const angle = (shipment.progress / 100) * 360;
  const Icon = modeIcons[shipment.mode];

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.currentTarget.blur();
        onSelectShipment(shipment.id);
      }}
      className={cn(
        "flex w-full flex-col gap-5 rounded-xl border p-3 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
        active && "border-primary bg-muted/50",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="shrink-0">{format(messages.shipmentId, locale, { id: shipment.id })}</div>

        <div className="flex min-w-0 items-center gap-1">
          <div style={{ "--angle": `${angle}deg` } as CSSProperties} className={getProgressRingClass(shipment.status)}>
            <div className="bg-card grid size-2 place-items-center rounded-full">
              <div className="size-1 rounded-full bg-current" />
            </div>
          </div>
          <div className="text-muted-foreground min-w-0 text-xs break-words">{shipment.statusLabel}</div>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <div
            className={cn(`flag:${shipment.origin.countryCode.toUpperCase()}`, "shrink-0 rounded-xs text-3xl outline")}
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="text-xs leading-tight font-medium break-words">{shipment.origin.country}</div>
            <div className="text-muted-foreground text-xs break-words hyphens-auto">{shipment.origin.display}</div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-right">
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="text-xs leading-tight font-medium break-words">{shipment.destination.country}</div>
            <div className="text-muted-foreground text-xs break-words hyphens-auto">{shipment.destination.display}</div>
          </div>
          <div
            className={cn(
              `flag:${shipment.destination.countryCode.toUpperCase()}`,
              "shrink-0 rounded-xs text-3xl outline",
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <span
          className="border-foreground h-px min-w-0 border-t border-dashed"
          style={{ flexGrow: shipment.progress, flexBasis: 0 }}
        />
        <Icon className={cn("size-3.5 shrink-0", shipment.mode === "air" && "rotate-45")} />
        <span
          className="border-border h-px min-w-0 border-t border-dashed"
          style={{ flexGrow: 100 - shipment.progress, flexBasis: 0 }}
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-muted-foreground text-xs leading-none">{text.cargo}</div>
          <div className="line-clamp-2 text-sm tracking-tight break-words hyphens-auto" title={shipment.cargo}>
            {shipment.cargo}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-muted-foreground text-xs leading-none">{text.eta}</div>
          <div className="text-sm tracking-tight tabular-nums">
            {shipment.eta}
            {shipment.etaMeta && (
              <span className="text-muted-foreground ml-1 text-xs font-normal">{shipment.etaMeta}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

const isTab = (value: string): value is ShipmentTab => shipmentTabs.some((tab) => tab === value);
const isMode = (value: string): value is ModeFilter => modeFilters.some((mode) => mode === value);

export function ShipmentList({ shipments, selectedShipmentId, onSelectShipment }: ShipmentListProps) {
  const messages = useMessages(logisticsMessageKey);
  const text = messages.list;
  const locale = useLocale();
  const [filter, setFilter] = useState(noShipmentFilter);
  const modeGroup = useId();
  const visible = filterShipments(shipments, filter);
  const tabs = shipmentTabs.map((value) => ({
    value,
    label: format(text.tabs[value], locale, { count: shipmentTotals[value] }),
  }));

  return (
    <Card className="h-full rounded-none ring-0">
      <CardHeader>
        <CardTitle className="text-xl font-normal">{text.title}</CardTitle>
        <CardAction>
          <PopoverOrSheet
            title={text.filter}
            className="w-56"
            align="end"
            trigger={
              <Button size="icon-sm" variant="ghost" aria-label={text.filter}>
                <SlidersHorizontal />
              </Button>
            }
          >
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{messages.details.transportMode}</legend>
              <RadioGroup
                value={filter.mode}
                onValueChange={(value) => isMode(value) && setFilter({ ...filter, mode: value })}
              >
                {modeFilters.map((mode) => (
                  <div key={mode} className="flex items-center gap-2">
                    <RadioGroupItem value={mode} id={`${modeGroup}-${mode}`} />
                    <label htmlFor={`${modeGroup}-${mode}`} className="text-sm">
                      {mode === "all" ? text.allModes : messages.modes[mode]}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </fieldset>
          </PopoverOrSheet>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden px-0">
        <Tabs value={filter.tab} onValueChange={(value) => isTab(value) && setFilter({ ...filter, tab: value })}>
          <TabsList className="w-full justify-start gap-4 overflow-x-auto border-b px-4" variant="line">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} className="flex-none text-xs" value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="px-4">
          <InputGroup className="h-8">
            <InputGroupInput
              className="h-8"
              aria-label={text.searchLabel}
              placeholder={text.searchPlaceholder}
              value={filter.query}
              onChange={(event) => setFilter({ ...filter, query: event.target.value })}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <ScrollArea className="h-0 flex-1">
          <div className="flex flex-col gap-4 px-4">
            {visible.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm" role="status">
                {text.empty}
              </p>
            ) : null}
            {visible.map((shipment) => (
              <ShipmentCard
                active={shipment.id === selectedShipmentId}
                key={shipment.id}
                shipment={shipment}
                onSelectShipment={onSelectShipment}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
