import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

import type { AttachmentId, MailId, MailNavId } from "./data";

/** Text of the mail app (embedded at /dashboard/mail and standalone at /mail). */
export interface MailMessages {
  readonly meta: PageMeta;
  readonly loading: string;
  readonly nav: Readonly<Record<MailNavId, string>>;
  readonly sidebar: {
    readonly newEmail: string;
    readonly folders: string;
    readonly accounts: string;
    readonly addAccount: string;
    readonly manageAccounts: string;
    readonly accountSettings: string;
    readonly signOut: string;
    readonly openAccountMenu: string;
    /** Placeholders: `{name}`, the account's name. */
    readonly selectAccount: string;
    /** Placeholders: `{name}`, the account's name. */
    readonly openMenuOf: string;
  };
  readonly inbox: {
    readonly title: string;
    readonly search: string;
    readonly viewOptions: string;
    readonly refresh: string;
    readonly moreActions: string;
    readonly pinned: string;
    /** Placeholders: `{title}`, `{count}`. */
    readonly groupTitle: string;
  };
  readonly view: {
    readonly close: string;
    readonly previous: string;
    readonly next: string;
    readonly pinThread: string;
    readonly archive: string;
    readonly reply: string;
    readonly moreActions: string;
    readonly replyAll: string;
    readonly forward: string;
    readonly markUnread: string;
    readonly addLabel: string;
    readonly moveToTrash: string;
    /** Includes its colon so French can put the no-break space in it. */
    readonly to: string;
    readonly cc: string;
    /** Placeholders: `{count}`. */
    readonly attachments: string;
    /** Placeholders: `{name}`, the sender. */
    readonly replyPlaceholder: string;
    readonly emoji: string;
    readonly attach: string;
    readonly send: string;
    readonly empty: string;
    readonly drawerTitle: string;
    readonly drawerDescription: string;
  };
  /** Attachment sizes. Placeholders: `{size}`. French says Ko and Mo. */
  readonly size: { readonly kb: string; readonly mb: string };
  /** Demo mails, written in each language the way a business in that country would write them. */
  readonly demo: {
    readonly mails: Readonly<Record<MailId, { readonly subject: string; readonly body: string }>>;
    /** File names of the demo attachments. */
    readonly attachments: Readonly<Record<AttachmentId, string>>;
  };
}

export const mailMessageKey: MessageKey<MailMessages> = messageKey<MailMessages>("mail");
