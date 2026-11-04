"use client";

import type { ReactNode } from "react";

import { cn } from "cn";

/** Toggleable liquid glass chip for toolbar filters; `leading` holds an avatar or swatch. */
export function FilterChip({
  pressed,
  onPressedChange,
  leading,
  children,
  className,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  leading?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      data-slot="filter-chip"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        "liquid-glass text-foreground/80 hover:text-foreground focus-visible:ring-ring flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition-colors outline-none focus-visible:ring-2",
        leading && "pl-1",
        pressed && "liquid-glass-active text-foreground ring-brand/70 ring-1",
        className,
      )}
    >
      {leading}
      {children}
    </button>
  );
}
