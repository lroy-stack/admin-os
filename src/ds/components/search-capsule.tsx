"use client";

import { cn } from "cn";
import { Search } from "lucide-react";

import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

/** Liquid glass search field used in screen toolbars. */
export function SearchCapsule({
  value,
  onValueChange,
  label,
  placeholder,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <InputGroup className={cn("liquid-glass h-9 w-full rounded-full border-0 sm:w-56", className)}>
      <InputGroupAddon align="inline-start">
        <Search className="size-3.5" />
      </InputGroupAddon>
      <InputGroupInput
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
    </InputGroup>
  );
}
