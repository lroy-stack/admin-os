import type { ReactNode } from "react";

import { cn } from "cn";

import { Badge } from "@/components/ui/badge";

import { type Tone, toneSolid, toneTint } from "./tones";

/** `Badge` tinted with a palette tone; `dot` adds a solid swatch in front. */
export function TonePill({
  tone,
  dot = false,
  children,
  className,
}: {
  tone: Tone;
  dot?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge variant="secondary" className={cn("text-foreground font-normal", toneTint[tone], className)}>
      {dot && <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", toneSolid[tone])} />}
      {children}
    </Badge>
  );
}
