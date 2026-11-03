import { type MessageKey, messageKey } from "@/core/i18n/client";

/** Text of the shared feedback pieces: copy, undo, read states and the awaiting-approval notice. */
export interface FeedbackMessages {
  readonly copy: {
    readonly copied: string;
    /** Placeholders: `{label}`. */
    readonly copiedLabel: string;
    readonly failed: string;
  };
}

export const feedbackMessageKey: MessageKey<FeedbackMessages> = messageKey<FeedbackMessages>("feedback");
