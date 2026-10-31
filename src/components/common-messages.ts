import { type MessageKey, messageKey } from "@/core/i18n/client";

/**
 * Text of the shared components in `src/components` (everything except `ui/` and `calendar/`). Add a key here only
 * when two screens need it; a string used by one screen belongs in that route's dictionary.
 */
export interface CommonMessages {
  readonly dateRange: {
    /** The picker's label while no date is chosen. */
    readonly select: string;
  };
}

export const commonMessageKey: MessageKey<CommonMessages> = messageKey<CommonMessages>("common");
