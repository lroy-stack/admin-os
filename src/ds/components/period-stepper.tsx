"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

/** ‹ Today › button group for stepping through days or calendar periods. */
export function PeriodStepper({
  onPrevious,
  onToday,
  onNext,
  previousLabel,
  nextLabel,
}: {
  onPrevious: () => void;
  onToday: () => void;
  onNext: () => void;
  previousLabel: string;
  nextLabel: string;
}) {
  return (
    <ButtonGroup aria-label="Change period" className="liquid-glass rounded-full p-0.5">
      <Button variant="ghost" size="icon" aria-label={previousLabel} className="size-8" onClick={onPrevious}>
        <ChevronLeft />
      </Button>
      <Button variant="ghost" className="h-8 px-3 text-xs" onClick={onToday}>
        Today
      </Button>
      <Button variant="ghost" size="icon" aria-label={nextLabel} className="size-8" onClick={onNext}>
        <ChevronRight />
      </Button>
    </ButtonGroup>
  );
}
