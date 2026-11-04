import { type MessageKey, messageKey, type PageMeta } from "@/core/i18n/client";

import type { AttachmentId, MailFolderId, MailId, MailLabelId } from "./data";

/** Text of the mail app (embedded at /dashboard/mail and standalone at /mail). */
export interface MailMessages {
  readonly meta: PageMeta;
  readonly loading: string;
  readonly nav: Readonly<Record<MailFolderId, string>>;
  readonly sidebar: {
    readonly newEmail: string;
    readonly folders: string;
    readonly accounts: string;
    /** Placeholders: `{name}`, the account's name. */
    readonly selectAccount: string;
    /** Placeholders: `{name}`, the account's name. */
    readonly openMenuOf: string;
    readonly keyboardShortcuts: string;
  };
  readonly inbox: {
    readonly title: string;
    readonly search: string;
    readonly viewOptions: string;
    readonly sortBy: string;
    readonly sorts: { readonly newest: string; readonly oldest: string; readonly unread: string };
    readonly noResults: string;
    readonly noResultsHint: string;
    readonly emptyFolder: string;
    readonly emptyFolderHint: string;
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
    /** Placeholders: `{name}`. */
    readonly replyPlaceholder: string;
    /** Placeholders: `{name}`. */
    readonly replyAllPlaceholder: string;
    /** Placeholders: `{names}`, the recipients. */
    readonly replyingTo: string;
    /** Placeholders: `{from}`, `{names}`, `{time}`. */
    readonly replyMeta: string;
    readonly replyDemoNote: string;
    readonly send: string;
    readonly empty: string;
    readonly drawerTitle: string;
    readonly drawerDescription: string;
    readonly toast: { readonly archived: string; readonly trashed: string };
  };
  readonly labels: Readonly<Record<MailLabelId, string>>;
  readonly shortcuts: {
    readonly title: string;
    readonly description: string;
    readonly next: string;
    readonly previous: string;
    readonly archive: string;
    readonly compose: string;
    readonly search: string;
  };
  readonly compose: {
    readonly newTitle: string;
    readonly forwardTitle: string;
    /** Placeholders: `{email}`, the account the message leaves from. */
    readonly description: string;
    readonly to: string;
    readonly cc: string;
    readonly subject: string;
    readonly body: string;
    readonly addressesHint: string;
    readonly send: string;
    /** Placeholders: `{subject}`. */
    readonly forwardSubject: string;
    /** Placeholders: `{name}`, the sender; `{body}`. */
    readonly forwardBody: string;
    readonly errors: {
      readonly toRequired: string;
      readonly addressInvalid: string;
      readonly subjectRequired: string;
      readonly bodyRequired: string;
    };
    readonly toast: { readonly sent: string };
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
