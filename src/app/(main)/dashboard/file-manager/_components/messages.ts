import { type MessageKey, messageKey, type PageMeta, type Plural } from "@/core/i18n/client";

import type { FileId, FileKind, FolderId } from "./data";

/** Text of /dashboard/file-manager (My files), including the demo file and folder names. */
export interface FileManagerMessages {
  readonly meta: PageMeta;
  readonly title: string;
  readonly subtitle: string;
  readonly newFolder: string;
  readonly upload: string;
  readonly search: { readonly label: string; readonly placeholder: string };
  readonly filter: {
    readonly trigger: string;
    readonly show: string;
    readonly allFiles: string;
    readonly starred: string;
    readonly shared: string;
    readonly fileType: string;
    readonly allTypes: string;
    readonly sortBy: string;
    readonly lastModified: string;
    readonly name: string;
    readonly fileSize: string;
  };
  readonly kinds: Readonly<Record<FileKind, string>>;
  readonly folders: {
    readonly title: string;
    /** Placeholders: `{count}`. */
    readonly count: Plural;
    /** Placeholders: `{count}`. */
    readonly files: Plural;
    /** Placeholders: `{when}`. */
    readonly updated: string;
    /** Placeholders: `{name}`. */
    readonly actionsFor: string;
    readonly open: string;
    readonly copyLink: string;
    readonly rename: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
  };
  readonly files: {
    readonly title: string;
    readonly viewLabel: string;
    readonly gridView: string;
    readonly listView: string;
    /** Placeholders: `{when}`, `{owner}`. */
    readonly modifiedBy: string;
    /** Placeholders: `{name}`. */
    readonly star: string;
    /** Placeholders: `{name}`. */
    readonly unstar: string;
    readonly addToStarred: string;
    readonly removeFromStarred: string;
    readonly download: string;
    readonly copyLink: string;
    readonly moveToTrash: string;
    /** Placeholders: `{name}`. */
    readonly actionsFor: string;
    readonly shared: string;
  };
  readonly columns: {
    readonly name: string;
    readonly owner: string;
    readonly modified: string;
    readonly size: string;
    readonly actions: string;
  };
  /** Demo content: file and folder names are business text, written for each language. */
  readonly names: {
    readonly folders: Readonly<Record<FolderId, string>>;
    readonly files: Readonly<Record<FileId, string>>;
  };
}

export const fileManagerMessageKey: MessageKey<FileManagerMessages> = messageKey<FileManagerMessages>("fileManager");
