"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

/** ‹ Today › button group for stepping through days or calendar periods. */
export function PeriodStepper({
  onPrevious,
  onToday,
  onNext,
  label,
  previousLabel,
  todayLabel,
  nextLabel,
}: {
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  /** Names the button group for assistive technology. */
  label: string;
  previousLabel: string;
  todayLabel: string;
  nextLabel: string;
}) {
  return (
    <ButtonGroup aria-label={label} className="liquid-glass rounded-full p-0.5">
      <Button variant="ghost" size="icon" aria-label={previousLabel} className="size-8" onClick={onPrevious}>
        <ChevronLeft />
      </Button>
      <Button variant="ghost" className="h-8 px-3 text-xs" onClick={onToday}>
        {todayLabel}
      </Button>
      <Button variant="ghost" size="icon" aria-label={nextLabel} className="size-8" onClick={onNext}>
        <ChevronRight />
      </Button>
    </ButtonGroup>
  );
}
