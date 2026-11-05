"use client";

import { type ReactNode, useState } from "react";

import { useMessages } from "@/core/i18n/client";
import { SegmentedControl, type SegmentedOption } from "@/ds/components";

import { productsMessageKey } from "./messages";

/** One view of the toggle: its label and the renderer's element, which the server has already filled with rows. */
export interface ProductViewPane {
  readonly id: string;
  readonly label: string;
  readonly content: ReactNode;
}

/**
 * The page header with the toggle between the views the viewer may read, and the view shown below it. With one view
 * there is no toggle. A view is mounted only while shown, so its search and pages start fresh each time.
 */
export function ProductViews({ heading, views }: { heading: ReactNode; views: readonly ProductViewPane[] }) {
  const text = useMessages(productsMessageKey);
  const [viewId, setViewId] = useState(views[0]?.id ?? "");
  const shown = views.find((view) => view.id === viewId) ?? views[0];
  const options: SegmentedOption<string>[] = views.map((view) => ({ value: view.id, label: view.label }));

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-4 md:px-6 md:pt-6">
        {heading}
        {views.length > 1 && (
          <SegmentedControl
            label={text.viewsLabel}
            value={shown?.id ?? ""}
            options={options}
            onValueChange={setViewId}
          />
        )}
      </div>
      <div key={shown?.id} className="flex min-h-0 min-w-0 flex-1 flex-col">
        {shown?.content}
      </div>
    </>
  );
}
