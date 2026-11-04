import { MAIL_IDS, type Mail, type MailFolderId, type MailLabelId } from "./data";

export const MAIL_SORTS = ["newest", "oldest", "unread"] as const;

export type MailSort = (typeof MAIL_SORTS)[number];

export const isMailSort = (value: string): value is MailSort => (MAIL_SORTS as readonly string[]).includes(value);

/** What the session changed on one message. Absent means untouched; `restoreEntry` puts a previous one back (undo). */
export interface MailEntry {
  readonly folder?: Mail["folder"];
  readonly isRead?: boolean;
  readonly isPinned?: boolean;
  readonly labels?: readonly MailLabelId[];
}

/**
 * The mail app of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state). It holds the
 * view (folder, search, sort, selection) and only what the session changed on each message, on top of the messages the
 * server rendered, so a language change still re-localizes the demo mails the session did not touch.
 */
export interface MailState {
  readonly selected: string | null;
  readonly folder: MailFolderId;
  readonly query: string;
  readonly sort: MailSort;
  /** The account the person writes as (`accounts` in `data.tsx`). */
  readonly accountId: number;
  readonly entries: Readonly<Record<string, MailEntry>>;
}

export const INITIAL_MAIL_STATE: MailState = {
  selected: MAIL_IDS[0],
  folder: "inbox",
  query: "",
  sort: "newest",
  accountId: 1,
  entries: {},
};

export function entryOf(state: MailState, id: string): MailEntry | undefined {
  return state.entries[id];
}

function withEntry(state: MailState, id: string, entry: MailEntry | undefined): MailState {
  const { [id]: _previous, ...rest } = state.entries;
  return { ...state, entries: entry === undefined ? rest : { ...rest, [id]: entry } };
}

/** The message with the session's changes on top. */
export function applyEntry(mail: Mail, entry: MailEntry | undefined): Mail {
  if (!entry) return mail;
  return {
    ...mail,
    folder: entry.folder ?? mail.folder,
    isRead: entry.isRead ?? mail.isRead,
    isPinned: entry.isPinned ?? mail.isPinned,
    labels: entry.labels ? [...entry.labels] : mail.labels,
  };
}

export function resolveMails(base: readonly Mail[], state: MailState): Mail[] {
  return base.map((mail) => applyEntry(mail, entryOf(state, mail.id)));
}

/** Priority is a view of the inbox: a message that was archived or trashed leaves it. */
export function inFolder(mail: Mail, folder: MailFolderId): boolean {
  return folder === "priority" ? mail.folder === "inbox" && mail.isPriority : mail.folder === folder;
}

export function matchesQuery(mail: Mail, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  const haystack = [mail.subject, mail.body, mail.from.name, mail.from.email, ...mail.to.map((to) => to.name)];
  return haystack.some((text) => text.toLowerCase().includes(needle));
}

const byNewest = (a: Mail, b: Mail) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt);

function sorted(mails: readonly Mail[], sort: MailSort): Mail[] {
  const list = [...mails];
  switch (sort) {
    case "newest":
      return list.sort(byNewest);
    case "oldest":
      return list.sort((a, b) => -byNewest(a, b));
    case "unread":
      return list.sort((a, b) => Number(a.isRead) - Number(b.isRead) || byNewest(a, b));
    default: {
      const unreachable: never = sort;
      return unreachable;
    }
  }
}

/** The messages the list shows: the folder, the search and the sort applied. */
export function visibleMails(mails: readonly Mail[], state: MailState): Mail[] {
  return sorted(
    mails.filter((mail) => inFolder(mail, state.folder) && matchesQuery(mail, state.query)),
    state.sort,
  );
}

/** The order a person reads the list in: the pinned group first, then the rest. Next and previous follow it. */
export function displayOrder(visible: readonly Mail[]): Mail[] {
  return [...visible.filter((mail) => mail.isPinned), ...visible.filter((mail) => !mail.isPinned)];
}

/** The id `step` places away from `id` in the list, or `null` at either end (or when `id` is not listed). */
export function neighbour(order: readonly Mail[], id: string, step: 1 | -1): string | null {
  const index = order.findIndex((mail) => mail.id === id);
  if (index === -1) return null;
  return order[index + step]?.id ?? null;
}

/** Where the selection goes when `id` leaves the list: the message after it, else the one before, else nothing. */
export function nextAfterRemoval(order: readonly Mail[], id: string): string | null {
  return neighbour(order, id, 1) ?? neighbour(order, id, -1);
}

export function unreadIn(mails: readonly Mail[], folder: MailFolderId): number {
  return mails.filter((mail) => inFolder(mail, folder) && !mail.isRead).length;
}

/** Opens a message: it becomes the selection and counts as read. */
export function selectMail(state: MailState, id: string): MailState {
  return { ...withEntry(state, id, { ...entryOf(state, id), isRead: true }), selected: id };
}

/** Selects without reading (undo puts the person back on the message). */
export function focusMail(state: MailState, id: string | null): MailState {
  return { ...state, selected: id };
}

/** Switches folder; the selection stays only if that message is shown there. */
export function setFolder(state: MailState, folder: MailFolderId, mails: readonly Mail[]): MailState {
  const kept = mails.some((mail) => mail.id === state.selected && inFolder(mail, folder));
  return { ...state, folder, selected: kept ? state.selected : null };
}

export function setQuery(state: MailState, query: string): MailState {
  return { ...state, query };
}

export function setSort(state: MailState, sort: MailSort): MailState {
  return { ...state, sort };
}

export function setAccount(state: MailState, accountId: number): MailState {
  return { ...state, accountId };
}

export function togglePin(state: MailState, mail: Mail): MailState {
  return withEntry(state, mail.id, { ...entryOf(state, mail.id), isPinned: !mail.isPinned });
}

export function markUnread(state: MailState, id: string): MailState {
  return withEntry(state, id, { ...entryOf(state, id), isRead: false });
}

export function toggleLabel(state: MailState, mail: Mail, label: MailLabelId): MailState {
  const labels = mail.labels.includes(label) ? mail.labels.filter((item) => item !== label) : [...mail.labels, label];
  return withEntry(state, mail.id, { ...entryOf(state, mail.id), labels });
}

export function moveTo(state: MailState, id: string, folder: Mail["folder"]): MailState {
  return withEntry(state, id, { ...entryOf(state, id), folder });
}

/** Undo: puts back what `entryOf` returned before the action (`undefined` clears the message's entry). */
export function restoreEntry(state: MailState, id: string, entry: MailEntry | undefined): MailState {
  return withEntry(state, id, entry);
}
