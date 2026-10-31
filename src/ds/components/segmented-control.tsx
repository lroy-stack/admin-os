"use client";

import { useRef } from "react";

import { cn } from "cn";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { LiquidThumb, useLiquidThumb } from "./liquid-thumb";

export type SegmentedOption<T extends string> = { value: T; label: string };

/** Liquid glass single choice control (6M / 12M, Board / List, Grid / Table…) with a sliding lens. */
export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
  label,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const thumb = useLiquidThumb(groupRef, value);

  return (
    <ToggleGroup
      ref={groupRef}
      type="single"
      spacing={0}
      value={value}
      aria-label={label}
      onValueChange={(next) => {
        const option = options.find((item) => item.value === next);
        if (option) onValueChange(option.value);
      }}
      className={cn("liquid-glass h-8 rounded-full p-0.5", className)}
    >
      <LiquidThumb {...thumb} />
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          data-thumb-key={option.value}
          className={cn(
            "text-foreground/70 hover:text-foreground data-[state=on]:text-foreground relative h-7 min-w-10 rounded-full! px-3 text-xs transition-colors duration-300 hover:bg-transparent data-[state=on]:bg-transparent",
            !thumb.rect && "data-[state=on]:bg-foreground/15",
          )}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
