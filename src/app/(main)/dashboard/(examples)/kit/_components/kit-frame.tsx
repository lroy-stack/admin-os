"use client";

import type { ReactNode } from "react";

import { DockedPanelLayout } from "@/ds/overlays";

/** The kit page opts into the docked column: the sections narrow when the docked panel opens beside them. */
export function KitFrame({ children }: { children: ReactNode }) {
  return <DockedPanelLayout>{children}</DockedPanelLayout>;
}
