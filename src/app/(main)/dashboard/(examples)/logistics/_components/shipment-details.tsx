import { cn } from "cn";
import { AlertTriangleIcon, Copy, Plane, Ship, Star, Truck } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { handlingTagIcons } from "./handling-icons";
import { logisticsMessageKey } from "./messages";
import type { Shipment } from "./shipment-localize";
import { ShipmentRouteMap } from "./shipment-route-map";

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

const statusBadgeClasses: Record<Shipment["status"], string> = {
  scheduled: "border-muted bg-muted/50 text-muted-foreground",
  inTransit: "border-primary/20 bg-primary/10 text-primary",
  outForDelivery: "border-primary/20 bg-primary/10 text-primary",
  delivered: "border-green-600/20 bg-green-600/10 text-green-600",
  delayed: "border-destructive/20 bg-destructive/10 text-destructive",
  onHold: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  customsHold: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

type ShipmentDetailsProps = {
  shipment: Shipment | null;
};

function ComingSoon({ children }: { children: string }) {
  return (
    <div className="text-muted-foreground grid h-full place-items-center rounded-md border border-dashed p-4 text-center text-sm">
      {children}
    </div>
  );
}

function EmptyShipmentOverview() {
  const text = useMessages(logisticsMessageKey).details;
  return (
    <div className="text-muted-foreground grid min-h-48 place-items-center rounded-lg border border-dashed p-4 text-center text-sm">
      {text.empty}
    </div>
  );
}

function ShipmentOverview({ shipment }: { shipment: Shipment }) {
  const messages = useMessages(logisticsMessageKey);
  const text = messages.details;
  const locale = useLocale();
  const ContactIcon = modeIcons[shipment.mode];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-medium tracking-tight tabular-nums sm:text-xl">
            {format(messages.shipmentId, locale, { id: shipment.id })}
          </h1>
          <Button variant="ghost" size="icon-sm" aria-label={text.copyId}>
            <Copy />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <Badge variant="outline" className={cn("gap-1.5", statusBadgeClasses[shipment.status])}>
            <span className={cn("size-1.5 rounded-full bg-current", progressRingClasses[shipment.status])} />
            {shipment.statusLabel}
          </Badge>
          <span aria-hidden="true" className="bg-border h-3 w-px" />
          <span className="text-foreground tabular-nums">{shipment.complete}</span>
          <span aria-hidden="true" className="bg-border h-3 w-px" />
          <span className="text-foreground tabular-nums">
            {format(text.etaLine, locale, { eta: shipment.eta, meta: shipment.etaMeta })}
          </span>
        </div>
      </div>

      <Separator />

      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-9 shrink-0 after:rounded-sm">
            <AvatarFallback className="rounded-sm">{shipment.customer.initials}</AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-sm leading-tight font-medium break-words">{shipment.customer.name}</div>
            <div className="text-muted-foreground flex items-center gap-2">
              <span className="text-xs leading-none tracking-tight tabular-nums">{shipment.customer.id}</span>
              <Copy className="size-3 shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-end gap-1 text-right">
          <Badge variant="secondary" className="max-w-full">
            <Star />
            <span className="truncate" title={shipment.customer.tierName}>
              {shipment.customer.tierName}
            </span>
          </Badge>
          <div className="text-muted-foreground text-xs leading-tight break-words hyphens-auto">
            {shipment.customer.tierNote}
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h2 className="min-w-0 font-medium break-words">{text.cargoDetails}</h2>

          <Button variant="outline" size="sm">
            <ContactIcon data-icon="inline-start" />
            {text.contact[shipment.mode]}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-[1.35fr_1fr_1.1fr_1.15fr_1fr]">
          <div className="col-span-2 flex min-w-0 flex-col gap-1 md:col-span-1 md:gap-2">
            <div className="text-muted-foreground text-xs leading-none md:invisible md:text-sm">{text.tabs.cargo}</div>
            <div className="text-sm leading-tight break-words hyphens-auto">{shipment.cargo}</div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-tight break-words md:text-sm">{text.totalWeight}</div>
            <div className="text-sm leading-tight tabular-nums">{shipment.weight}</div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-tight break-words md:text-sm">
              {text.transportMode}
            </div>
            <div className="text-sm leading-tight break-words">
              {format(text.modeRoute, locale, { mode: shipment.modeLabel, route: shipment.routeTypeLabel })}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="text-muted-foreground text-xs leading-tight break-words md:text-sm">
              {text.transportNumber[shipment.mode]}
            </div>
            <div className="text-sm leading-tight break-words">{shipment.transportNumber}</div>
          </div>

          <div className="flex min-w-0 flex-col gap-2 md:text-right">
            <div className="text-muted-foreground text-xs leading-tight break-words md:text-sm">{text.status}</div>
            <div className="text-sm leading-tight tabular-nums">{shipment.complete}</div>
          </div>
        </div>
      </div>

      <Separator />

      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
        <AlertTriangleIcon />
        <AlertTitle>{shipment.handling.label}</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="border-amber-900 leading-snug text-amber-900 dark:border-amber-50 dark:text-amber-50">
            {shipment.handling.note}
          </div>

          <Separator className="bg-amber-800 dark:bg-amber-50" />

          <div className="flex flex-wrap gap-2">
            {shipment.handling.tags.map(({ id, label }) => {
              const TagIcon = handlingTagIcons[id];
              return (
                <Badge
                  className="bg-background/50 h-auto min-h-5 rounded-sm border-amber-200 py-0.5 text-amber-900 dark:border-amber-900 dark:text-amber-50"
                  key={id}
                  variant="outline"
                >
                  <TagIcon data-icon="inline-start" />
                  {label}
                </Badge>
              );
            })}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function ShipmentDetails({ shipment }: ShipmentDetailsProps) {
  const text = useMessages(logisticsMessageKey).details;

  if (!shipment) {
    return (
      <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
        <div className="min-h-0 overflow-hidden">
          <ShipmentRouteMap shipment={null} />
        </div>
        <div className="min-h-0 overflow-hidden p-4">
          <EmptyShipmentOverview />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[320px_1fr] overflow-hidden lg:grid-rows-[420px_1fr]">
      <div className="min-h-0 overflow-hidden">
        <ShipmentRouteMap shipment={shipment} />
      </div>
      <div className="min-h-0 overflow-hidden">
        <div className="h-full min-h-0 py-2">
          <Tabs defaultValue="overview" className="h-full gap-0">
            <TabsList
              className="w-full justify-start gap-2 overflow-x-auto border-b px-4 **:data-[slot=tabs-trigger]:text-xs sm:gap-4 sm:**:data-[slot=tabs-trigger]:text-sm"
              variant="line"
            >
              <TabsTrigger className="flex-none" value="overview">
                {text.tabs.overview}
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="route">
                {text.tabs.route}
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="cargo">
                {text.tabs.cargo}
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="documents">
                {text.tabs.documents}
              </TabsTrigger>
              <TabsTrigger className="flex-none" value="activity">
                {text.tabs.activity}
              </TabsTrigger>
            </TabsList>
            <TabsContent className="min-h-0 overflow-auto p-4" value="overview">
              <ShipmentOverview shipment={shipment} />
            </TabsContent>
            <TabsContent className="p-4" value="route">
              <ComingSoon>{text.comingSoon.route}</ComingSoon>
            </TabsContent>
            <TabsContent className="p-4" value="cargo">
              <ComingSoon>{text.comingSoon.cargo}</ComingSoon>
            </TabsContent>
            <TabsContent className="p-4" value="documents">
              <ComingSoon>{text.comingSoon.documents}</ComingSoon>
            </TabsContent>
            <TabsContent className="p-4" value="activity">
              <ComingSoon>{text.comingSoon.activity}</ComingSoon>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
