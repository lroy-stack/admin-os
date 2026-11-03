"use client";

import { type ReactNode, useRef } from "react";

import { cn } from "cn";

import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

import { useViewport } from "./use-viewport";

export interface ResponsivePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Announced when the panel opens. */
  title: ReactNode;
  /** Required for assistive technology; `hideDescription` keeps it out of the layout. */
  description: ReactNode;
  hideDescription?: boolean;
  /** Classes of the panel itself (size, surface). */
  className?: string;
  headerClassName?: string;
  titleClassName?: string;
  children: ReactNode;
}

/**
 * A side sheet from 768 px and a bottom drawer below. Nothing renders until the viewport is known, so the server HTML
 * never holds an open overlay and the direction is never guessed. The body is the only scroll container. Focus moves
 * into the panel on open and returns to the element that opened it on close.
 */
export function ResponsivePanel({
  open,
  onOpenChange,
  title,
  description,
  hideDescription = false,
  className,
  headerClassName,
  titleClassName,
  children,
}: ResponsivePanelProps) {
  const viewport = useViewport();
  const opener = useRef<Element | null>(null);
  if (viewport === undefined) return null;

  return (
    <Drawer direction={viewport === "phone" ? "bottom" : "right"} open={open} onOpenChange={onOpenChange} autoFocus>
      <DrawerContent
        onOpenAutoFocus={() => {
          opener.current = document.activeElement;
        }}
        onCloseAutoFocus={(event) => {
          // Radix only returns focus to its own Trigger; this panel is opened by app state, so it restores it.
          event.preventDefault();
          if (opener.current instanceof HTMLElement && opener.current.isConnected) opener.current.focus();
        }}
        className={cn(
          "data-[vaul-drawer-direction=right]:w-full data-[vaul-drawer-direction=right]:sm:max-w-md",
          className,
        )}
      >
        <DrawerHeader className={cn(hideDescription && "sr-only", headerClassName)}>
          <DrawerTitle className={titleClassName}>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div data-slot="responsive-panel-body" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
