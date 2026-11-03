"use client";

import { createContext, type ReactNode, useContext, useEffect, useEffectEvent, useId, useRef, useState } from "react";

import { cn } from "cn";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useMessages } from "@/core/i18n/client";
import { useGuardedExit } from "@/ds/feedback";

import { DiscardChanges } from "./discard-changes";
import { overlaysMessageKey } from "./messages";
import { type PanelMode, panelMode } from "./panel-mode";
import { useHydrated } from "./use-hydrated";
import type { PanelPickControl } from "./use-panel-pick";
import { type ReturnFocus, useRestoreFocus } from "./use-restore-focus";
import { useViewport } from "./use-viewport";

/**
 * The page opts into the docked column by wrapping its content in `DockedPanelLayout`. The layout is a flex row: the
 * page on the left (`min-w-0 flex-1`) and an empty slot on the right. An open `DockedPanel` portals its column into
 * that slot, so the slot takes the column's width in the same commit that mounts the panel: the page content narrows
 * to make room, the panel is part of the document flow (no overlay, nothing covers the page, no fixed offsets to
 * keep in step with the header) and there is no intermediate frame where the two overlap. Closed, the slot is empty
 * and takes no space. Below 1024 px the slot is never used.
 */
const SlotContext = createContext<HTMLElement | null | undefined>(undefined);

export function DockedPanelLayout({ children, className }: { children: ReactNode; className?: string }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <SlotContext value={slot}>
      <div className={cn("flex items-start", className)}>
        <div className="min-w-0 flex-1">{children}</div>
        <div ref={setSlot} data-slot="docked-panel-slot" className="sticky top-4 shrink-0 self-start empty:hidden" />
      </div>
    </SlotContext>
  );
}

export interface DockedPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the panel ("New reservation"): its accessible name and the first thing announced. */
  title: string;
  description?: string;
  /**
   * The body. A function learns the mode: `docked` is true in the column, where the page stays usable and can answer a
   * pick, and false in the full-screen sheet, where the page is out of reach and picking on it is not possible.
   */
  children: ReactNode | ((panel: { docked: boolean }) => ReactNode);
  /** The buttons; a function receives `close`, which closes the way Escape does: a dirty panel asks first. */
  footer?: ReactNode | ((panel: { close: () => void }) => ReactNode);
  /** Unsaved changes: Escape or close ask before discarding. */
  dirty?: boolean;
  /** From `usePanelPick()`: shows the pick hint while the page is asked, and Escape leaves pick mode first. */
  pick?: PanelPickControl;
  /** Where focus goes on close when the opener was not focused or is gone by then. Defaults to the opener. */
  returnFocus?: ReturnFocus;
}

const FIRST_FOCUSABLE =
  'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Create or edit while the page stays in use (ADR 0015). From 1024 px a nonmodal right column beside the page, a
 * labelled region and not a dialog: the page keeps working, focus moves in on open and back to the opener on close, and
 * Escape closes it when focus is inside. Below 1024 px a full-screen modal sheet. Which one is chosen when the panel
 * opens and kept until it closes (resizing would remount the body and lose the form). Nothing renders until the
 * viewport is known, so the server HTML never holds an open panel.
 */
export function DockedPanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dirty = false,
  pick,
  returnFocus,
}: DockedPanelProps) {
  const text = useMessages(overlaysMessageKey);
  const hydrated = useHydrated();
  const current = panelMode(useViewport());
  const slot = useContext(SlotContext);
  const [asking, setAsking] = useState(false);
  // A route change or Back with unsaved changes asks too, through the same question.
  const exit = useGuardedExit(dirty && open);
  const [locked, setLocked] = useState<PanelMode | null>(null);
  if (open && locked === null && current !== undefined) setLocked(current);
  if (!open && locked !== null) setLocked(null);
  if (!open && asking) setAsking(false);
  const mode = locked ?? current;

  const endPick = useEffectEvent(() => pick?.cancel());
  useEffect(() => {
    if (!open) endPick();
  }, [open]);

  if (!hydrated || mode === undefined) return null;

  const requestClose = () => (dirty ? setAsking(true) : onOpenChange(false));
  const body = typeof children === "function" ? children({ docked: mode === "column" }) : children;
  const bottom = footer ? (
    <div data-slot="window-footer" className="bg-muted/50 flex flex-col gap-3 border-t p-4">
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {typeof footer === "function" ? footer({ close: requestClose }) : footer}
      </div>
    </div>
  ) : null;
  const closeButton = (
    <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" onClick={requestClose}>
      <X aria-hidden />
      <span className="sr-only">{text.window.close}</span>
    </Button>
  );
  const noDescription = description ? {} : { "aria-describedby": undefined };

  // In the column the layout provides the slot; a page that did not opt in gets the sheet rather than nothing.
  const inColumn = mode === "column" && slot !== undefined;
  // The slot is known one commit after the layout mounts: wait for it instead of flashing the sheet.
  const column = open && inColumn && slot !== null ? slot : null;

  return (
    <>
      {column
        ? createPortal(
            <PanelColumn
              title={title}
              description={description}
              pick={pick}
              returnFocus={returnFocus}
              onRequestClose={requestClose}
              bottom={bottom}
              closeButton={closeButton}
            >
              {body}
            </PanelColumn>,
            column,
          )
        : null}
      {inColumn ? null : (
        <SheetPanel
          open={open}
          onOpenChange={onOpenChange}
          dirty={dirty}
          title={title}
          description={description}
          noDescription={noDescription}
          returnFocus={returnFocus}
          onRequestClose={requestClose}
          body={body}
          bottom={bottom}
          closeButton={closeButton}
        />
      )}
      <DiscardChanges open={asking} onOpenChange={setAsking} onDiscard={() => onOpenChange(false)} />
      <DiscardChanges
        open={exit.asking}
        onOpenChange={(next) => {
          if (!next) exit.stay();
        }}
        onDiscard={exit.leave}
      />
    </>
  );
}

function SheetPanel({
  open,
  onOpenChange,
  dirty,
  title,
  description,
  noDescription,
  returnFocus,
  onRequestClose,
  body,
  bottom,
  closeButton,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dirty: boolean;
  title: string;
  description?: string;
  noDescription: { "aria-describedby"?: undefined };
  returnFocus?: ReturnFocus;
  onRequestClose: () => void;
  body: ReactNode;
  bottom: ReactNode;
  closeButton: ReactNode;
}) {
  const focus = useRestoreFocus(returnFocus);
  return (
    <Drawer direction="bottom" open={open} onOpenChange={onOpenChange} dismissible={!dirty} autoFocus>
      <DrawerContent
        {...focus}
        data-window="docked"
        {...noDescription}
        onEscapeKeyDown={(event) => {
          if (!dirty) return;
          event.preventDefault();
          onRequestClose();
        }}
        className="data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-dvh data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-none data-[vaul-drawer-direction=bottom]:border-t-0"
      >
        <div className="flex flex-col gap-1 p-4 pr-12 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description ? <DrawerDescription>{description}</DrawerDescription> : null}
        </div>
        <div data-slot="window-body" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          {body}
        </div>
        {bottom}
        {closeButton}
      </DrawerContent>
    </Drawer>
  );
}

function PanelColumn({
  title,
  description,
  pick,
  returnFocus,
  onRequestClose,
  bottom,
  closeButton,
  children,
}: {
  title: string;
  description?: string;
  pick?: PanelPickControl;
  returnFocus?: ReturnFocus;
  onRequestClose: () => void;
  bottom: ReactNode;
  closeButton: ReactNode;
  children: ReactNode;
}) {
  const text = useMessages(overlaysMessageKey);
  const ids = { title: useId(), description: useId() };
  const root = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const focus = useRestoreFocus(returnFocus);
  const picking = pick?.picking ?? null;

  const enter = useEffectEvent(() => focus.onOpenAutoFocus());
  const leave = useEffectEvent(() => focus.onCloseAutoFocus(new Event("focus")));
  // Focus moves in when the column mounts and goes back to the opener when it unmounts, unless the person has
  // meanwhile moved on to the page (then it stays where they put it).
  useEffect(() => {
    const element = root.current;
    enter();
    (body.current?.querySelector<HTMLElement>(FIRST_FOCUSABLE) ?? element)?.focus();
    return () => {
      const active = document.activeElement;
      if (active === null || active === document.body || element?.contains(active)) leave();
    };
  }, []);

  const stopPicking = useEffectEvent(() => pick?.cancel());
  // While the page is asked, focus is usually on the page: Escape must reach pick mode from anywhere.
  useEffect(() => {
    if (picking === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stopPicking();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [picking]);

  return (
    <section
      ref={root}
      aria-labelledby={ids.title}
      aria-describedby={description ? ids.description : undefined}
      tabIndex={-1}
      data-window="docked"
      data-picking={picking !== null}
      onKeyDown={(event) => {
        // A popover portaled out of the panel still bubbles here in React's tree; only keys from inside count.
        if (event.key !== "Escape" || !event.currentTarget.contains(event.target as Node)) return;
        if (picking !== null) return;
        event.stopPropagation();
        onRequestClose();
      }}
      className="bg-card text-card-foreground relative ms-4 flex max-h-[calc(100dvh-2rem)] w-96 flex-col overflow-hidden rounded-xl border outline-none"
    >
      <div className="flex flex-col gap-1 p-4 pr-12">
        <h2 id={ids.title} className="text-base font-medium">
          {title}
        </h2>
        {description ? (
          <p id={ids.description} className="text-muted-foreground text-sm">
            {description}
          </p>
        ) : null}
      </div>
      <div role="status" data-slot="pick-hint" className="px-4 empty:hidden">
        {picking === null ? null : (
          <div className="bg-accent text-accent-foreground flex items-center justify-between gap-2 rounded-lg p-2 text-sm">
            <span>{text.dock.pickHint}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => pick?.cancel()}>
              {text.dock.stopPicking}
            </Button>
          </div>
        )}
      </div>
      <div ref={body} data-slot="window-body" className="min-h-0 flex-1 overflow-y-auto p-4">
        {children}
      </div>
      {bottom}
      {closeButton}
    </section>
  );
}
