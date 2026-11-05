"use client";

import { useRef, useState } from "react";

/**
 * The open state of a window and its opener. `opening` changes with every opening, so a window keyed by it remounts
 * and starts clean; `opener` takes focus back on close.
 */
export function useOpening() {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);
  const show = () => {
    setOpening((count) => count + 1);
    setOpen(true);
  };
  return { open, setOpen, opening, opener, show };
}
