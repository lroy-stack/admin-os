import {
  type ChatChannelId,
  type ChatNavId,
  type ChatTagId,
  type ChatViewId,
  CONVERSATION_IDS,
  CONVERSATION_TABS,
  type Contact,
  type Conversation,
  type ConversationStatus,
  type ConversationTab,
  type Message,
  type SnoozeId,
  VIEW_TAGS,
} from "./data";

/** Which conversations the sidebar shows: a view of the inbox, a channel, or a saved view. */
export type ChatScope =
  | { readonly kind: "nav"; readonly id: ChatNavId }
  | { readonly kind: "channel"; readonly id: ChatChannelId }
  | { readonly kind: "view"; readonly id: ChatViewId };

export interface ChatFilter {
  readonly unread: boolean;
  readonly priority: boolean;
}

/** What the session changed on one conversation. Absent means untouched; `restoreEntry` puts a previous one back (undo). */
export interface ConversationEntry {
  readonly status?: ConversationStatus;
  readonly snooze?: SnoozeId;
  readonly isPriority?: boolean;
  readonly isBlocked?: true;
  readonly tagIds?: readonly ChatTagId[];
  /** Opened in the session: the unread badge is gone. */
  readonly read?: true;
  /** Messages and notes written in the session, oldest first. */
  readonly appended?: readonly Message[];
  /** The text and time the list shows once a reply was sent. */
  readonly latest?: { readonly preview: string; readonly time: string };
}

/**
 * The chat app of a session on demo-local state (ADR 0015: a showcase screen keeps demo-local state). It holds the view
 * (scope, tab, search, filter, selection) and only what the session changed on each conversation, on top of the
 * conversations the server rendered, so a language change still re-localizes the demo content the session did not touch.
 */
export interface ChatState {
  readonly selected: number | null;
  readonly scope: ChatScope;
  readonly tab: ConversationTab;
  readonly query: string;
  readonly filter: ChatFilter;
  /** Counts the messages and conversations the session wrote, so each gets its own id. */
  readonly sequence: number;
  readonly created: readonly Conversation[];
  readonly entries: Readonly<Record<number, ConversationEntry>>;
}

export const INITIAL_CHAT_STATE: ChatState = {
  selected: CONVERSATION_IDS[0],
  scope: { kind: "nav", id: "inbox" },
  tab: "all",
  query: "",
  filter: { unread: false, priority: false },
  sequence: 0,
  created: [],
  entries: {},
};

export function entryOf(state: ChatState, id: number): ConversationEntry | undefined {
  return state.entries[id];
}

function withEntry(state: ChatState, id: number, entry: ConversationEntry | undefined): ChatState {
  const { [id]: _previous, ...rest } = state.entries;
  return { ...state, entries: entry === undefined ? rest : { ...rest, [id]: entry } };
}

/** The conversation with the session's changes on top. */
export function applyEntry(conversation: Conversation, entry: ConversationEntry | undefined): Conversation {
  if (!entry) return conversation;
  return {
    ...conversation,
    status: entry.status ?? conversation.status,
    snooze: entry.status === undefined ? conversation.snooze : entry.snooze,
    isPriority: entry.isPriority ?? conversation.isPriority,
    isBlocked: entry.isBlocked ?? conversation.isBlocked,
    tagIds: entry.tagIds ? [...entry.tagIds] : conversation.tagIds,
    isUnread: entry.read ? false : conversation.isUnread,
    unreadCount: entry.read ? 0 : conversation.unreadCount,
    preview: entry.latest?.preview ?? conversation.preview,
    time: entry.latest?.time ?? conversation.time,
    messages: entry.appended ? [...conversation.messages, ...entry.appended] : conversation.messages,
  };
}

export function resolveConversations(base: readonly Conversation[], state: ChatState): Conversation[] {
  return [...base, ...state.created].map((conversation) => applyEntry(conversation, entryOf(state, conversation.id)));
}

/** The last message came from the team, so the conversation counts as sent. */
const lastWasOurs = (conversation: Conversation) => conversation.messages.at(-1)?.align === "end";

export function inScope(conversation: Conversation, scope: ChatScope): boolean {
  switch (scope.kind) {
    case "channel":
      return conversation.channel === scope.id;
    case "view":
      return VIEW_TAGS[scope.id].some((tag) => conversation.tagIds.includes(tag));
    case "nav": {
      const id = scope.id;
      switch (id) {
        case "inbox":
          return conversation.status !== "closed";
        case "snoozed":
          return conversation.status === "snoozed";
        case "sent":
          return lastWasOurs(conversation);
        case "all":
          return true;
        default: {
          const unreachable: never = id;
          return unreachable;
        }
      }
    }
    default: {
      const unreachable: never = scope;
      return unreachable;
    }
  }
}

export const inTab = (conversation: Conversation, tab: ConversationTab) => tab === "all" || conversation.status === tab;

export function matchesQuery(conversation: Conversation, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  const { contact } = conversation;
  return [conversation.name, conversation.subject, conversation.preview, contact.company, contact.email].some((text) =>
    text.toLowerCase().includes(needle),
  );
}

export const matchesFilter = (conversation: Conversation, filter: ChatFilter) =>
  (!filter.unread || conversation.isUnread) && (!filter.priority || conversation.isPriority);

/** The list: scope, tab, search and filter applied, in the order the conversations were given. */
export function visibleConversations(conversations: readonly Conversation[], state: ChatState): Conversation[] {
  return conversations.filter(
    (conversation) =>
      inScope(conversation, state.scope) &&
      inTab(conversation, state.tab) &&
      matchesQuery(conversation, state.query) &&
      matchesFilter(conversation, state.filter),
  );
}

/** The conversations of the scope the search and filter leave, counted by tab, for the numbers beside the tabs. */
export function tabCounts(conversations: readonly Conversation[], state: ChatState): Record<ConversationTab, number> {
  const inView = conversations.filter(
    (conversation) =>
      inScope(conversation, state.scope) &&
      matchesQuery(conversation, state.query) &&
      matchesFilter(conversation, state.filter),
  );
  return {
    all: inView.length,
    open: inView.filter((conversation) => inTab(conversation, "open")).length,
    snoozed: inView.filter((conversation) => inTab(conversation, "snoozed")).length,
    closed: inView.filter((conversation) => inTab(conversation, "closed")).length,
  };
}

/** The unread conversations of a scope, for the badge beside it in the sidebar. */
export function unreadIn(conversations: readonly Conversation[], scope: ChatScope): number {
  return conversations.filter((conversation) => inScope(conversation, scope) && conversation.isUnread).length;
}

export const sameScope = (a: ChatScope, b: ChatScope) => a.kind === b.kind && a.id === b.id;

/** The conversation the thread shows: the selected one, else the first of the list, else none. */
export function activeConversation(
  all: readonly Conversation[],
  visible: readonly Conversation[],
  state: ChatState,
): Conversation | null {
  return all.find((conversation) => conversation.id === state.selected) ?? visible[0] ?? null;
}

/** Opens a conversation: it becomes the selection and its unread badge goes. */
export function selectConversation(state: ChatState, id: number): ChatState {
  return { ...withEntry(state, id, { ...entryOf(state, id), read: true }), selected: id };
}

/** Choosing another scope starts from its whole list, so the tab goes back to All. */
export function setScope(state: ChatState, scope: ChatScope): ChatState {
  return { ...state, scope, tab: "all" };
}

export const isConversationTab = (value: string): value is ConversationTab =>
  (CONVERSATION_TABS as readonly string[]).includes(value);

export function setTab(state: ChatState, tab: ConversationTab): ChatState {
  return { ...state, tab };
}

export function setQuery(state: ChatState, query: string): ChatState {
  return { ...state, query };
}

export function setFilter(state: ChatState, filter: ChatFilter): ChatState {
  return { ...state, filter };
}

/** What the composer writes: a reply the contact receives, or an internal note only the team sees. */
export interface Outgoing {
  readonly kind: "reply" | "note";
  readonly text: string;
  /** The time as the thread shows it ("Just now"), in the active language. */
  readonly time: string;
}

/** Appends a reply or a note to a conversation. A reply also becomes the list's preview; a note does not. */
export function appendMessage(state: ChatState, id: number, outgoing: Outgoing): ChatState {
  const entry = entryOf(state, id);
  const message: Message = {
    id: 100_000 + state.sequence,
    align: "end",
    text: outgoing.text,
    time: outgoing.time,
    kind: outgoing.kind === "note" ? "note" : undefined,
  };
  const latest = outgoing.kind === "reply" ? { preview: outgoing.text, time: outgoing.time } : entry?.latest;
  return {
    ...withEntry(state, id, { ...entry, read: true, appended: [...(entry?.appended ?? []), message], latest }),
    sequence: state.sequence + 1,
  };
}

/** What the New conversation window collects; the host adds the words that depend on the language. */
export interface NewConversation {
  readonly name: string;
  readonly email: string;
  readonly channel: ChatChannelId;
  readonly subject: string;
  readonly message: string;
  /** In the active language: "Just now", "Today", "Lead". */
  readonly words: { readonly time: string; readonly day: string; readonly status: string };
}

/** Starts a conversation with a first message from the team; it is selected and listed under Today. */
export function createConversation(state: ChatState, fields: NewConversation): ChatState {
  const id = 1000 + state.sequence;
  const contact: Contact = {
    name: fields.name,
    role: "",
    company: "",
    email: fields.email,
    phone: "",
    website: "",
    location: "",
    timezone: "",
    status: fields.words.status,
    qualifiedAt: "",
  };
  const conversation: Conversation = {
    id,
    group: "today",
    channel: fields.channel,
    status: "open",
    isPriority: false,
    isBlocked: false,
    tagIds: [],
    name: fields.name,
    subject: fields.subject,
    preview: fields.message,
    time: fields.words.time,
    dayLabel: fields.words.day,
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact,
    messages: [{ id: 100_000 + state.sequence, align: "end", text: fields.message, time: fields.words.time }],
  };
  return {
    ...state,
    selected: id,
    sequence: state.sequence + 1,
    // The new conversation must be on the list the person sees: back to the whole inbox.
    scope: { kind: "nav", id: "inbox" },
    tab: "all",
    query: "",
    filter: { unread: false, priority: false },
    created: [...state.created, conversation],
  };
}

/** Undo: puts back what `entryOf` returned before the action (`undefined` clears the conversation's entry). */
export function restoreEntry(state: ChatState, id: number, entry: ConversationEntry | undefined): ChatState {
  return withEntry(state, id, entry);
}

/** Marks a conversation as priority, or takes the mark off. */
export function togglePriority(state: ChatState, conversation: Conversation): ChatState {
  return withEntry(state, conversation.id, {
    ...entryOf(state, conversation.id),
    isPriority: !conversation.isPriority,
  });
}

/** Adds a tag to the contact, or removes it when it is there. */
export function toggleTag(state: ChatState, conversation: Conversation, tag: ChatTagId): ChatState {
  const tagIds = conversation.tagIds.includes(tag)
    ? conversation.tagIds.filter((id) => id !== tag)
    : [...conversation.tagIds, tag];
  return withEntry(state, conversation.id, { ...entryOf(state, conversation.id), tagIds });
}

/** Sets the conversation aside until the preset: it leaves Open and shows under Snoozed. */
export function snoozeConversation(state: ChatState, id: number, preset: SnoozeId): ChatState {
  return withEntry(state, id, { ...entryOf(state, id), status: "snoozed", snooze: preset });
}

/** Brings a snoozed conversation back to Open. */
export function wakeConversation(state: ChatState, id: number): ChatState {
  return withEntry(state, id, { ...entryOf(state, id), status: "open", snooze: undefined });
}

/** Blocks the contact: the conversation closes and is marked blocked. */
export function blockContact(state: ChatState, id: number): ChatState {
  return withEntry(state, id, { ...entryOf(state, id), status: "closed", snooze: undefined, isBlocked: true });
}
