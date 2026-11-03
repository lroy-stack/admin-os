import { type MessageKey, messageKey, type Plural } from "@/core/i18n/client";

/** Text of the shared feedback pieces: copy, undo, read states and the awaiting-approval notice. */
export interface FeedbackMessages {
  readonly copy: {
    readonly copied: string;
    /** Placeholders: `{label}`. */
    readonly copiedLabel: string;
    readonly failed: string;
  };
  readonly undo: {
    readonly action: string;
    readonly undone: string;
    readonly failed: string;
    /** Placeholders: `{count}` (whole seconds left). */
    readonly countdown: Plural;
  };
}

export const feedbackMessageKey: MessageKey<FeedbackMessages> = messageKey<FeedbackMessages>("feedback");
