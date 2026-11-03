import type { Viewport } from "./use-viewport";

/** `column` beside the page (nonmodal), `sheet` full-screen and modal. */
export type PanelMode = "column" | "sheet";

/** The column needs room for the page and a panel side by side: from 1024 px (ADR 0015). `undefined` until known. */
export function panelMode(viewport: Viewport | undefined): PanelMode | undefined {
  if (viewport === undefined) return undefined;
  return viewport === "desktop" ? "column" : "sheet";
}
