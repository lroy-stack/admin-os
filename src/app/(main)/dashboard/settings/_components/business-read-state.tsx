"use client";

import type { ReactNode } from "react";

import { useRouter } from "next/navigation";

import { useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";
import { ReadState } from "@/ds/feedback";

import { businessSettingsMessageKey } from "./messages";

/** The kit's read state for the business details, with Retry re-reading the page. */
export function BusinessReadState({
  state,
  reason,
  children,
}: {
  state: ReadStatus;
  reason?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const text = useMessages(businessSettingsMessageKey);
  return (
    <ReadState
      state={state}
      {...(reason === undefined ? {} : { reason })}
      onRetry={() => router.refresh()}
      emptyTitle={text.notSet}
    >
      {children}
    </ReadState>
  );
}
