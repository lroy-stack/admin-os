"use client";

import * as React from "react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { logisticsMessageKey } from "./messages";
import { ShipmentDetails } from "./shipment-details";
import { ShipmentList } from "./shipment-list";
import type { Shipment } from "./shipment-localize";

/** `shipments` arrive written for the request's locale (`localizeShipments`). */
export function Logistics({ shipments }: { shipments: Shipment[] }) {
  const text = useMessages(logisticsMessageKey);
  const locale = useLocale();
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = React.useState<string | null>(shipments[0]?.id ?? null);
  const selectedShipment = shipments.find((shipment) => shipment.id === selectedShipmentId) ?? shipments[0] ?? null;

  function handleSelectShipment(shipmentId: string) {
    setSelectedShipmentId(shipmentId);

    if (window.innerWidth < 1024) {
      setDetailsOpen(true);
    }
  }

  return (
    <>
      <div
        data-content-padding="false"
        className="grid h-[calc(100dvh-var(--dashboard-header-height))] overflow-hidden lg:grid-cols-[400px_minmax(0,1fr)] lg:divide-x"
      >
        <div className="h-full overflow-hidden">
          <ShipmentList
            shipments={shipments}
            selectedShipmentId={selectedShipmentId}
            onSelectShipment={handleSelectShipment}
          />
        </div>
        <div className="hidden h-full overflow-hidden lg:block">
          <ShipmentDetails shipment={selectedShipment} />
        </div>
      </div>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          side="right"
          className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:w-3/4"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {selectedShipment
                ? format(text.sheet.title, locale, { id: selectedShipment.id })
                : text.sheet.fallbackTitle}
            </SheetTitle>
            <SheetDescription>{text.sheet.description}</SheetDescription>
          </SheetHeader>
          <ShipmentDetails shipment={selectedShipment} />
        </SheetContent>
      </Sheet>
    </>
  );
}
