"use client";

import { type ReactElement, type ReactNode, useRef, useState } from "react";

import { cn } from "cn";
import { Slot } from "radix-ui";

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

import { useRestoreFocus } from "./use-restore-focus";
import { useViewport, type Viewport } from "./use-viewport";

export interface PopoverOrSheetProps {
  /** The one element that opens it (a Button). It keeps its own markup; the sheet adds `aria-expanded` and the click. */
  trigger: ReactElement;
  /** The sheet's heading and the popover's accessible name. Names the job ("Filter bookings"). */
  title: string;
  description?: string;
  /** The content. A function receives `close`, for a control that applies the choice and dismisses the panel. */
  children: ReactNode | ((panel: { close: () => void }) => ReactNode);
  /** Controlled state; omit both to let it manage itself. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Popover alignment against the trigger. */
  align?: "start" | "center" | "end";
  /** Classes of the popover surface (width), not of the sheet. */
  className?: string;
}

type PanelKind = "popover" | "sheet";

const kindOf = (viewport: Viewport): PanelKind => (viewport === "phone" ? "sheet" : "popover");

/**
 * Pick a value, filter, small settings, notifications (ADR 0015): a popover anchored to its trigger from 768 px and a
 * bottom sheet below. The kind is chosen when it opens and kept until it closes, so a resize never remounts the
 * content. Nothing opens until the viewport is known, so the server HTML holds the trigger and no overlay. Focus
 * moves in on open and returns to the trigger on close; Escape closes.
 */
export function PopoverOrSheet({
  trigger,
  title,
  description,
  children,
  open: openProp,
  onOpenChange,
  align = "start",
  className,
}: PopoverOrSheetProps) {
  const [inner, setInner] = useState(false);
  const open = openProp ?? inner;
  const setOpen = (next: boolean) => {
    setInner(next);
    onOpenChange?.(next);
  };
  const triggerRef = useRef<HTMLElement>(null);
  const focus = useRestoreFocus(triggerRef);
  const viewport = useViewport();
  const [locked, setLocked] = useState<PanelKind | null>(null);
  const current = viewport === undefined ? undefined : kindOf(viewport);
  if (open && locked === null && current !== undefined) setLocked(current);
  if (!open && locked !== null) setLocked(null);
  const kind = locked ?? current;

  const content = typeof children === "function" ? children({ close: () => setOpen(false) }) : children;
  // Without a description Radix would warn; with one it links it by itself, so the prop must be absent then.
  const noDescription = description ? {} : { "aria-describedby": undefined };

  return (
    <>
      <Slot.Root
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-expanded={kind === undefined ? false : open}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </Slot.Root>
      {kind === "popover" ? (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverAnchor virtualRef={triggerRef} />
          <PopoverContent
            {...focus}
            {...noDescription}
            aria-label={title}
            align={align}
            // The trigger toggles on its own click; letting the outside press close first would reopen it.
            onInteractOutside={(event) => {
              if (event.target instanceof Node && triggerRef.current?.contains(event.target)) event.preventDefault();
            }}
            className={cn(
              "max-h-(--radix-popover-content-available-height) w-72 overflow-y-auto overscroll-contain",
              className,
            )}
          >
            {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
            {content}
          </PopoverContent>
        </Popover>
      ) : null}
      {kind === "sheet" ? (
        <Drawer direction="bottom" open={open} onOpenChange={setOpen} autoFocus>
          <DrawerContent
            {...focus}
            {...noDescription}
            data-window="popover-or-sheet"
            className="data-[vaul-drawer-direction=bottom]:max-h-[85dvh]"
          >
            <DrawerHeader>
              <DrawerTitle>{title}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            </DrawerHeader>
            <div
              data-slot="popover-or-sheet-body"
              className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4"
            >
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}
    </>
  );
}
