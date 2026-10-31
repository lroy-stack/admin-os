import Link from "next/link";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const circleClassName = "size-8 rounded-full text-foreground/80 ring-1 ring-border hover:bg-foreground/10";

/** Small outlined circle used for card actions (more, open, add). Renders a link when `href` is set. */
export function CardIconButton({
  icon: Icon,
  label,
  href,
  className,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  className?: string;
}) {
  if (href) {
    return (
      <Button asChild variant="ghost" size="icon" className={cn(circleClassName, className)}>
        <Link prefetch={false} href={href} aria-label={label}>
          <Icon className="size-3.5" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" aria-label={label} className={cn(circleClassName, className)}>
      <Icon className="size-3.5" />
    </Button>
  );
}
