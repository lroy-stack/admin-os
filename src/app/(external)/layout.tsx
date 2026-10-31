import type { ReactNode } from "react";

import { LocaleRoot } from "@/app/_components/locale-root";

import { landingBundle } from "./_components/messages.server";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <LocaleRoot bundles={[landingBundle]}>{children}</LocaleRoot>;
}
