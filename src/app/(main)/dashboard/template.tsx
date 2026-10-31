import { type ReactNode, ViewTransition } from "react";

/**
 * Re-mounts on every dashboard navigation so the page content can enter and exit.
 * Links tagged nav-forward / nav-back slide in that direction; other navigations fade.
 */
export default function Template({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page-fade" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
