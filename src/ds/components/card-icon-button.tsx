import type { ComponentProps } from "react";

import Link from "next/link";

import { cn } from "cn";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const circleClassName = "size-8 rounded-full text-foreground/80 ring-1 ring-border hover:bg-foreground/10";

interface CardIconButtonBase {
  icon: LucideIcon;
  /** Accessible name; the button shows only the icon. */
  label: string;
  className?: string;
}

/** A button: takes every Button prop (`onClick`, `ref`, the trigger props a `DropdownMenuTrigger asChild` passes down). */
type CardIconButtonAsButton = CardIconButtonBase &
  Omit<ComponentProps<typeof Button>, "asChild" | "children" | "size" | "variant" | "className"> & { href?: never };

/** A link: no trigger props and no button ref. */
type CardIconButtonAsLink = CardIconButtonBase & { href: string };

export type CardIconButtonProps = CardIconButtonAsButton | CardIconButtonAsLink;

/** Small outlined circle used for card actions (more, open, add, export). Renders a link when `href` is set. */
export function CardIconButton(props: CardIconButtonProps) {
  if (props.href !== undefined) {
    const { icon: Icon, label, href, className } = props;
    return (
      <Button asChild variant="ghost" size="icon" className={cn(circleClassName, className)}>
        <Link prefetch={false} href={href} aria-label={label}>
          <Icon className="size-3.5" />
        </Link>
      </Button>
    );
  }

  const { icon: Icon, label, className, href: _href, ...rest } = props;
  return (
    <Button variant="ghost" size="icon" className={cn(circleClassName, className)} {...rest} aria-label={label}>
      <Icon className="size-3.5" />
    </Button>
  );
}
