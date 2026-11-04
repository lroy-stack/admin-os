"use client";

import { useRef } from "react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { EcommerceMessages } from "../messages";
import { customerEmail } from "../order-view";
import type { OrderRow } from "./schema";

export interface OrderActions {
  /** Opens the order panel; `opener` is the menu button, where focus returns. */
  readonly view: (order: OrderRow, opener: Element | null) => void;
  readonly copyId: (order: OrderRow) => void;
}

/** The row menu of an order: View order, Contact customer (an email link) and Copy order ID. */
export function OrderMenu({
  order,
  text,
  actions,
}: {
  order: OrderRow;
  text: EcommerceMessages["orders"]["menu"];
  actions: OrderActions;
}) {
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex w-full justify-end">
          <Button ref={trigger} aria-label={text.open} size="icon-sm" variant="ghost">
            <MoreHorizontal />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuLabel>{text.label}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => actions.view(order, trigger.current)}>{text.view}</DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`mailto:${customerEmail(order.customer)}`}>{text.contact}</a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.copyId(order)}>{text.copyId}</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
