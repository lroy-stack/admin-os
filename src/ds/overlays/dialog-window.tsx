"use client";

import { type ReactNode, useState } from "react";

import { cn } from "cn";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useMessages } from "@/core/i18n/client";
import { useGuardedExit } from "@/ds/feedback";

import { DiscardChanges } from "./discard-changes";
import { overlaysMessageKey } from "./messages";
import { type ReturnFocus, useRestoreFocus } from "./use-restore-focus";
import { useViewport, type Viewport } from "./use-viewport";

export interface DialogWindowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Names the action ("Seat walk-in"); announced when the window opens. */
  title: string;
  description?: string;
  children: ReactNode;
  /**
   * The buttons; the primary one repeats the verb of the title. A function receives `close`, which closes the window
   * the way Escape does: a dirty window asks first.
   */
  footer?: ReactNode | ((window: { close: () => void }) => ReactNode);
  /** Unsaved changes: the backdrop is ignored, and Escape or close ask before discarding. */
  dirty?: boolean;
  /** Adds the footer note "Demo data, not saved" for showcase screens whose data is local. */
  demo?: boolean;
  /** Where focus goes on close when the opener was not focused or is gone by then (a menu item). Defaults to the opener. */
  returnFocus?: ReturnFocus;
}

type DialogWindowKind = "quick" | "form";

/** Dialog width from 768 px and the sheet below, by job (ADR 0015). */
const LAYOUT: Record<DialogWindowKind, { dialog: string; sheet: string }> = {
  quick: {
    dialog: "sm:max-w-[30rem]",
    sheet: "data-[vaul-drawer-direction=bottom]:max-h-[85dvh]",
  },
  form: {
    dialog: "sm:max-w-[40rem]",
    sheet:
      "data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:h-dvh data-[vaul-drawer-direction=bottom]:max-h-none data-[vaul-drawer-direction=bottom]:rounded-none data-[vaul-drawer-direction=bottom]:border-t-0",
  },
};

/**
 * The shared body of QuickDialog and FormDialog: a centered dialog from 768 px and a bottom or full-screen sheet below,
 * chosen only once the viewport is known so the server HTML holds nothing open. The body is the only scroll container,
 * the close button comes last in the tab order so focus lands on the first field, and a dirty window asks with a
 * ConfirmAction before it closes.
 */
export function DialogWindow({
  kind,
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  dirty = false,
  demo = false,
  returnFocus,
}: DialogWindowProps & { kind: DialogWindowKind }) {
  const text = useMessages(overlaysMessageKey);
  const current = useViewport();
  const focus = useRestoreFocus(returnFocus);
  const [asking, setAsking] = useState(false);
  // A route change or Back with unsaved changes asks too, through the same question.
  const exit = useGuardedExit(dirty && open);
  const [locked, setLocked] = useState<Viewport | null>(null);
  // The container is chosen when the window opens and kept until it closes: swapping Drawer for Dialog on a resize
  // (a phone turned to landscape) would remount the body and lose the form state and the focus return.
  if (open && locked === null && current !== undefined) setLocked(current);
  if (!open && locked !== null) setLocked(null);
  // A close from outside (the parent sets `open` to false) must not leave the question orphaned over the page.
  if (!open && asking) setAsking(false);
  const viewport = locked ?? current;
  if (viewport === undefined) return null;

  // Without a description Radix would warn; with one it links it by itself, so the prop must be absent then.
  const noDescription = description ? {} : { "aria-describedby": undefined };
  const requestClose = () => (dirty ? setAsking(true) : onOpenChange(false));
  const onEscapeKeyDown = (event: KeyboardEvent) => {
    if (!dirty) return;
    event.preventDefault();
    setAsking(true);
  };

  const body = (
    <div data-slot="window-body" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      {children}
    </div>
  );
  const bottom =
    footer || demo ? (
      <div data-slot="window-footer" className="bg-muted/50 flex flex-col gap-3 border-t p-4">
        {demo ? <p className="text-muted-foreground text-xs">{text.window.demoNote}</p> : null}
        {footer ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {typeof footer === "function" ? footer({ close: requestClose }) : footer}
          </div>
        ) : null}
      </div>
    ) : null;
  const closeButton = (
    <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" onClick={requestClose}>
      <X aria-hidden />
      <span className="sr-only">{text.window.close}</span>
    </Button>
  );

  return (
    <>
      {viewport === "phone" ? (
        <Drawer direction="bottom" open={open} onOpenChange={onOpenChange} dismissible={!dirty} autoFocus>
          <DrawerContent
            {...focus}
            data-window={kind}
            {...noDescription}
            onEscapeKeyDown={onEscapeKeyDown}
            className={LAYOUT[kind].sheet}
          >
            <div className="flex flex-col gap-1 p-4 pr-12 text-left">
              <DrawerTitle>{title}</DrawerTitle>
              {description ? <DrawerDescription>{description}</DrawerDescription> : null}
            </div>
            {body}
            {bottom}
            {closeButton}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent
            {...focus}
            data-window={kind}
            {...noDescription}
            showCloseButton={false}
            onEscapeKeyDown={onEscapeKeyDown}
            onInteractOutside={(event) => {
              if (dirty) event.preventDefault();
            }}
            className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0", LAYOUT[kind].dialog)}
          >
            <div className="flex flex-col gap-1 p-4 pr-12">
              <DialogTitle>{title}</DialogTitle>
              {description ? <DialogDescription>{description}</DialogDescription> : null}
            </div>
            {body}
            {bottom}
            {closeButton}
          </DialogContent>
        </Dialog>
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
