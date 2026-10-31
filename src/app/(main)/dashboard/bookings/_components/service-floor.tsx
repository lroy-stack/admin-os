"use client";

import type { ReactNode } from "react";

import { cn } from "cn";
import { PanelLeftClose } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMessages } from "@/core/i18n/client";

import { bookingsMessageKey } from "./messages";

const SHEET_PEEK_PX = 148;
/** Lowest phone sheet height: a peek with the current slot summary. */
export const SHEET_PEEK = `${SHEET_PEEK_PX}px`;
/** Phone sheet heights: the peek, half, and almost full screen. */
const SHEET_SNAP_POINTS = [SHEET_PEEK, 0.5, 0.92];
export type SheetSnap = number | string | null;

/**
 * Service layout: time rail beside the room, foldable to a strip. In full view it fills its frame; on phones the
 * rail then becomes a persistent bottom sheet so the room keeps the screen.
 */
export function ServiceFloor({
  fullView,
  railCollapsed,
  onRailCollapsedChange,
  rail,
  railStrip,
  railTitle,
  railSummary,
  room,
  isMobile,
  sheetSnap,
  onSheetSnapChange,
  aside,
}: {
  fullView: boolean;
  railCollapsed: boolean;
  onRailCollapsedChange: (collapsed: boolean) => void;
  rail: ReactNode;
  railStrip: ReactNode;
  railTitle: string;
  railSummary: string;
  room: ReactNode;
  isMobile: boolean;
  /** Controlled so the screen can drop the sheet back to its peek after a selection. */
  sheetSnap: SheetSnap;
  onSheetSnapChange: (snap: SheetSnap) => void;
  /** Takes the rail's column instead of the rail (the room editor's panel), so nothing covers the room; never folds. */
  aside?: ReactNode;
}) {
  const text = useMessages(bookingsMessageKey);
  const sheetRail = isMobile && fullView;
  const folded = railCollapsed && !aside;
  const railColumn = folded ? (
    railStrip
  ) : (
    <>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm break-words">{railTitle}</span>
          <span className="text-muted-foreground truncate text-[11px]">{railSummary}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={text.rail.fold}
              className="text-muted-foreground hover:text-foreground size-7 rounded-full"
              onClick={() => onRailCollapsedChange(true)}
            >
              <PanelLeftClose />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{text.rail.fold}</TooltipContent>
        </Tooltip>
      </div>
      {rail}
    </>
  );

  return (
    <>
      <div
        className={cn(
          "grid min-h-0 gap-3 transition-[grid-template-columns] duration-300 md:gap-4",
          fullView ? "h-full" : "h-[clamp(30rem,72dvh,52rem)]",
          folded
            ? "md:grid-cols-[3.5rem_minmax(0,1fr)]"
            : "md:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]",
        )}
      >
        <Card className="hidden min-h-0 gap-0 overflow-hidden py-0 md:flex">{aside ?? railColumn}</Card>
        <Card
          className="min-h-0 gap-0 overflow-hidden p-0"
          style={sheetRail ? { marginBottom: SHEET_PEEK_PX } : undefined}
        >
          {room}
        </Card>
      </div>

      {sheetRail && (
        <Drawer
          open
          modal={false}
          dismissible={false}
          snapPoints={SHEET_SNAP_POINTS}
          activeSnapPoint={sheetSnap}
          setActiveSnapPoint={onSheetSnapChange}
        >
          {/* vaul measures snap points against the viewport, so the sheet spans it and the snaps reveal it.
              No overlay sits behind this sheet, so it blurs the white room instead of ghosting it. */}
          <DrawerContent className="h-dvh backdrop-blur-xl data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-none">
            <DrawerHeader className="py-2">
              <DrawerTitle className="text-sm">{railSummary}</DrawerTitle>
              <DrawerDescription className="sr-only">{text.rail.dragHint}</DrawerDescription>
            </DrawerHeader>
            {rail}
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
