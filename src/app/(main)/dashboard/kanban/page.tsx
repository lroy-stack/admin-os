import { Suspense } from "react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { initialBoard, localizeBoard } from "./_components/data";
import { Kanban } from "./_components/kanban";
import { kanbanBundle, kanbanMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/kanban", kanbanMessages);

export default async function Page() {
  const locale = await getLocale();
  // The demo tasks are written in the request's language; a new language reseeds the board.
  const board = localizeBoard(initialBoard, kanbanMessages[locale].tasks);

  return (
    <LocaleBundles bundles={[kanbanBundle]}>
      <div data-content-padding="false">
        <Suspense fallback={null}>
          <Kanban key={locale} initialBoard={board} />
        </Suspense>
      </div>
    </LocaleBundles>
  );
}
