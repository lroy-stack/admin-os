import type { ReactNode } from "react";

import { LocaleRoot } from "@/app/_components/locale-root";
import { feedbackBundle } from "@/ds/feedback/server";
import { overlaysBundle } from "@/ds/overlays/server";

/** The windows of the app (undo toast, copy, dialogs) read the kit's dictionaries, which the dashboard layout otherwise supplies. */
export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <LocaleRoot bundles={[feedbackBundle, overlaysBundle]}>{children}</LocaleRoot>;
}
