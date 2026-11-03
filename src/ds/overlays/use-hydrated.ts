import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

/** False on the server and during hydration, true afterwards: gate anything the server cannot know. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
