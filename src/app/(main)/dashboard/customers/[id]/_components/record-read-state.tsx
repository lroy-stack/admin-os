"use client";

import { useRouter } from "next/navigation";

import type { ReadStatus } from "@/core/result";
import { ReadState } from "@/ds/feedback";

/** The kit's read state for a record that failed to load, with Retry re-reading the page. */
export function RecordReadState({ state, reason }: { state: ReadStatus; reason: string | undefined }) {
  const router = useRouter();
  return (
    <ReadState
      state={state}
      {...(reason === undefined ? {} : { reason })}
      onRetry={() => router.refresh()}
      emptyTitle=""
    >
      {null}
    </ReadState>
  );
}
