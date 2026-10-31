import type { ReactNode } from "react";

import { LocaleRoot } from "@/app/_components/locale-root";

import { authBundle } from "./_components/messages.server";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <LocaleRoot bundles={[authBundle]}>{children}</LocaleRoot>;
}
