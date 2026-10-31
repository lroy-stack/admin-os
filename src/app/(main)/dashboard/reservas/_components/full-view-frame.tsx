"use client";

import { type ReactNode, useEffect, useEffectEvent, useRef } from "react";

import { cn } from "cn";

/**
 * Makes everything around `frame` inert, up to <body>, so focus and screen readers stay inside it. Body-level
 * portals (popovers, menus, drawers, toasts) are left live. Returns the undo.
 */
function inertSurroundings(frame: HTMLElement) {
  const inerted: HTMLElement[] = [];
  for (let node = frame; node.parentElement && node.parentElement !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert) {
        sibling.inert = true;
        inerted.push(sibling);
      }
    }
  }
  return () => {
    for (const element of inerted) element.inert = false;
  };
}

/**
 * Lifts its content into a fixed layer over the page without remounting it, so the room keeps its WebGL context
 * and camera. Escape exits unless a popover, menu, drawer or the room editor handled the key first.
 */
export function FullViewFrame({
  active,
  onExit,
  label,
  className,
  children,
}: {
  active: boolean;
  onExit: () => void;
  /** Accessible name of the region while it is active. */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Escape" && !event.defaultPrevented) onExit();
  });

  useEffect(() => {
    const frame = ref.current;
    if (!active || !frame) return;
    window.addEventListener("keydown", onKey);
    const restoreInert = inertSurroundings(frame);
    // The layer owns the viewport while it is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      restoreInert();
      document.body.style.overflow = previous;
    };
  }, [active]);

  return (
    <section
      ref={ref}
      aria-label={active ? label : undefined}
      className={cn(
        "flex flex-col gap-6",
        className,
        active && "bg-background/95 fixed inset-0 z-50 gap-3 p-3 backdrop-blur-xl md:p-4",
      )}
    >
      {children}
    </section>
  );
}
