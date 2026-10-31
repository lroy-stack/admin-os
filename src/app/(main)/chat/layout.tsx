import type { ReactNode } from "react";

import { LocaleRoot } from "@/app/_components/locale-root";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return <LocaleRoot>{children}</LocaleRoot>;
}
