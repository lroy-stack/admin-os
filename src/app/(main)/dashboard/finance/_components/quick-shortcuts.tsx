"use client";

import { Banknote, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/core/i18n/client";

import { BILLS_ID } from "./anchors";
import { useShowTransactions } from "./finance-tabs";
import { financeMessageKey } from "./messages";

/** The two shortcuts that have a destination: History opens the Transactions tab, Pay bills goes to the bills. */
export function QuickShortcuts() {
  const text = useMessages(financeMessageKey).quick.shortcuts;
  const showTransactions = useShowTransactions();

  const goToBills = () => {
    const bills = document.getElementById(BILLS_ID);
    if (!bills) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bills.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    bills.focus({ preventScroll: true });
  };

  const shortcuts = [
    { id: "payBills", icon: Banknote, label: text.payBills, run: goToBills },
    { id: "history", icon: History, label: text.history, run: showTransactions },
  ] as const;

  return (
    <div className="grid grid-cols-4 gap-4">
      {shortcuts.map((shortcut) => {
        const Icon = shortcut.icon;
        return (
          <div key={shortcut.id} className="flex min-w-0 flex-col items-center gap-2.5">
            <Button
              variant="outline"
              className="size-12 rounded-full"
              aria-label={shortcut.label}
              onClick={shortcut.run}
            >
              <Icon className="size-5" />
            </Button>
            <span className="text-muted-foreground min-w-0 text-center text-xs break-words hyphens-auto">
              {shortcut.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
