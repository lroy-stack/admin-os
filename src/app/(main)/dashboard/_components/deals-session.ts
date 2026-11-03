"use client";

import { useSyncExternalStore } from "react";

import { type DealsState, EMPTY_DEALS_STATE } from "./deal-state";

/**
 * The browser's copy of the session's deals (demo-local: nothing leaves the page, a reload starts over). One module
 * instance serves Home and the Pipeline, so a deal edited on one is edited on the other.
 */
let current: DealsState = EMPTY_DEALS_STATE;
const listeners = new Set<() => void>();

export function getDealsState(): DealsState {
  return current;
}

/** Applies a pure transition from `deal-state.ts` and tells the screens. */
export function updateDeals(transition: (state: DealsState) => DealsState): void {
  current = transition(current);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The session's deals; the server render and hydration see the untouched state. */
export function useDealsState(): DealsState {
  return useSyncExternalStore(subscribe, getDealsState, () => EMPTY_DEALS_STATE);
}
