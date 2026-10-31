import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type {
  ChatChannelId,
  ChatNavId,
  ChatTagId,
  ChatViewId,
  ContactStatus,
  ConversationGroup,
  ConversationId,
} from "./data";

/** The words of one demo conversation, written in each language. People, companies and addresses stay in the data. */
export interface ConversationText {
  readonly subject: string;
  readonly preview: string;
  readonly role: string;
  /** In the order of the conversation's messages. */
  readonly messages: readonly string[];
}

/** Text of the chat app (embedded at /dashboard/chat and standalone at /chat). */
export interface ChatMessages {
  readonly meta: PageMeta;
  readonly header: {
    readonly title: string;
    readonly search: string;
    readonly newConversation: string;
    readonly notifications: string;
    readonly settings: string;
  };
  readonly nav: Readonly<Record<ChatNavId, string>>;
  readonly channels: Readonly<Record<ChatChannelId, string>>;
  readonly views: Readonly<Record<ChatViewId, string>>;
  readonly sidebar: {
    readonly channels: string;
    readonly views: string;
    readonly account: string;
    readonly settings: string;
    readonly logOut: string;
  };
  readonly list: {
    readonly title: string;
    readonly toggleSidebar: string;
    readonly filter: string;
    readonly tabs: { readonly all: string; readonly open: string; readonly snoozed: string; readonly closed: string };
    /** The count next to a tab label. Placeholders: `{count}`. */
    readonly tabCount: string;
    readonly groups: Readonly<Record<ConversationGroup, string>>;
    /** Read by screen readers next to the unread badge. Placeholders: `{count}`. */
    readonly unread: Plural;
  };
  /** Compact times of the list and the thread. */
  readonly time: {
    readonly justNow: string;
    /** Placeholders: `{count}`, minutes. */
    readonly minutesShort: string;
    readonly yesterday: string;
  };
  readonly thread: {
    readonly back: string;
    readonly call: string;
    readonly tag: string;
    readonly snooze: string;
    readonly moreActions: string;
    readonly viewProfile: string;
    readonly copyEmail: string;
    readonly markPriority: string;
    readonly blockContact: string;
    readonly reply: string;
    readonly internalNote: string;
    readonly replyPlaceholder: string;
    readonly notePlaceholder: string;
    readonly format: string;
    readonly emoji: string;
    readonly attach: string;
    readonly insertLink: string;
    readonly aiAssist: string;
    readonly send: string;
    /** Placeholders: `{emoji}`. */
    readonly reaction: string;
  };
  readonly profile: {
    readonly sheetTitle: string;
    readonly sheetDescription: string;
    readonly close: string;
    readonly email: string;
    readonly call: string;
    readonly schedule: string;
    readonly copyLink: string;
    readonly more: string;
    readonly tabs: { readonly details: string; readonly files: string; readonly activity: string };
    readonly fields: {
      readonly email: string;
      readonly phone: string;
      readonly website: string;
      readonly company: string;
      readonly role: string;
      readonly stage: string;
      readonly qualifiedSince: string;
      readonly timezone: string;
      readonly location: string;
      readonly tags: string;
    };
  };
  readonly status: Readonly<Record<ContactStatus, string>>;
  readonly tags: Readonly<Record<ChatTagId, string>>;
  /** Demo conversations, written the way a business in each country would write them. */
  readonly demo: Readonly<Record<ConversationId, ConversationText>>;
}

export const chatMessageKey: MessageKey<ChatMessages> = messageKey<ChatMessages>("chat");
