import type { ComponentProps } from "react";

import Link from "next/link";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const circleClassName = "size-8 rounded-full text-foreground/80 ring-1 ring-border hover:bg-foreground/10";

type CardIconButtonProps = Omit<ComponentProps<typeof Button>, "asChild" | "children" | "size" | "variant"> & {
  icon: LucideIcon;
  /** Accessible name; the button shows only the icon. */
  label: string;
  href?: string;
};

/**
 * Small outlined circle used for card actions (more, open, add, export). Renders a link when `href` is set.
 * Takes every Button prop (`onClick`, `ref`, the trigger props a `DropdownMenuTrigger asChild` passes down).
 */
export function CardIconButton({ icon: Icon, label, href, className, ...props }: CardIconButtonProps) {
  if (href) {
    return (
      <Button asChild variant="ghost" size="icon" className={cn(circleClassName, className)} {...props}>
        <Link prefetch={false} href={href} aria-label={label}>
          <Icon className="size-3.5" />
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" className={cn(circleClassName, className)} {...props} aria-label={label}>
      <Icon className="size-3.5" />
    </Button>
  );
}
