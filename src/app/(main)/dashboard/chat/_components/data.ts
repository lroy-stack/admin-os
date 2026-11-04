import type { LucideIcon } from "lucide-react";
import { Clock3, Inbox, Mail, MessageCircle, Phone, Send, Star } from "lucide-react";

import { format, formatCalendarDate, formatRelative, formatTime, type Locale } from "@/core/i18n/client";

import type { ChatMessages } from "./messages";

export const CONVERSATION_IDS = [
  1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
] as const;

export type ConversationId = (typeof CONVERSATION_IDS)[number];

export type ConversationGroup = "pinned" | "today" | "yesterday";

export type ConversationStatus = "open" | "snoozed" | "closed";

export const SNOOZE_IDS = ["later", "tomorrow", "nextWeek"] as const;

export type SnoozeId = (typeof SNOOZE_IDS)[number];

export type ContactStatus = "lead" | "qualified" | "customer" | "atRisk";

export const CHAT_TAG_IDS = [
  "devops",
  "enterprise",
  "p0",
  "billing",
  "iam",
  "highValue",
  "sustainability",
  "finserv",
  "data",
  "performance",
  "smb",
  "onboarding",
  "platform",
  "npsPromoter",
  "churnRisk",
  "downgrade",
  "api",
  "scaling",
  "urgent",
  "ssl",
  "upgrade",
  "media",
  "bug",
  "reports",
  "integrations",
  "zapier",
  "rbac",
  "featureRequest",
  "mobile",
  "android",
  "partnership",
  "latam",
  "reseller",
  "compliance",
  "audit",
  "whiteLabel",
  "security",
  "mfa",
  "export",
  "demo",
  "sso",
  "azure",
  "account",
] as const;

export type ChatTagId = (typeof CHAT_TAG_IDS)[number];

/** A conversation as the client components see it: every text already in the request's language. */
export type Conversation = {
  /** A demo conversation's id is one of `CONVERSATION_IDS`; one started in the session has its own. */
  id: number;
  group: ConversationGroup;
  /** Where the conversation arrived from. */
  channel: ChatChannelId;
  status: ConversationStatus;
  /** Set while the conversation is snoozed: the preset it was snoozed with. */
  snooze?: SnoozeId;
  isPriority: boolean;
  /** The contact was blocked in the session: the conversation is closed. */
  isBlocked: boolean;
  /** The contact's tag ids; the dictionary names them. */
  tagIds: ChatTagId[];
  name: string;
  subject: string;
  preview: string;
  /** When the last message arrived, in compact form for the list ("Just now", "5m", "10:42 AM", "Yesterday"). */
  time: string;
  /** The day the thread started, for the separator above the messages. */
  dayLabel: string;
  isUnread: boolean;
  isOnline: boolean;
  unreadCount: number;
  contact: Contact;
  messages: Message[];
};

export type Message = {
  id: number;
  align: "start" | "end";
  text: string;
  time: string;
  reaction?: string;
  /** An internal note is written by the team and never reaches the contact. */
  kind?: "note";
};

export type Contact = {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  timezone: string;
  status: string;
  qualifiedAt: string;
};

export type ChatNavId = "inbox" | "snoozed" | "sent" | "all";
export type ChatChannelId = "email" | "chat" | "whatsapp" | "instagram" | "facebook" | "phone";
export type ChatViewId = "vip" | "orders" | "feedback";

export type NavItem<Id extends string> = {
  id: Id;
  icon: LucideIcon;
};

export const navItems: NavItem<ChatNavId>[] = [
  { id: "inbox", icon: Inbox },
  { id: "snoozed", icon: Clock3 },
  { id: "sent", icon: Send },
  { id: "all", icon: MessageCircle },
];

export const channelItems: NavItem<ChatChannelId>[] = [
  { id: "email", icon: Mail },
  { id: "chat", icon: MessageCircle },
  { id: "whatsapp", icon: Phone },
  { id: "instagram", icon: Phone },
  { id: "facebook", icon: Phone },
  { id: "phone", icon: Phone },
];

export const viewItems: NavItem<ChatViewId>[] = [
  { id: "vip", icon: Star },
  { id: "orders", icon: Inbox },
  { id: "feedback", icon: MessageCircle },
];

/** A view is the conversations whose contact carries one of its tags. */
export const VIEW_TAGS: Readonly<Record<ChatViewId, readonly ChatTagId[]>> = {
  vip: ["enterprise", "highValue"],
  orders: ["billing", "export"],
  feedback: ["npsPromoter", "featureRequest", "bug"],
};

export const CONVERSATION_TABS = ["all", "open", "snoozed", "closed"] as const;

export type ConversationTab = (typeof CONVERSATION_TABS)[number];

export const currentUser = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
};

/** The demo's frozen moment. Times are UTC, like the other demo clocks, so the screen never depends on the device. */
export const CHAT_NOW = Date.parse("2026-05-06T12:00:00Z");
export const CHAT_TIME_ZONE = "UTC";

const DAYS = { today: "2026-05-06", yesterday: "2026-05-05" } as const;

type ConversationSeed = {
  id: ConversationId;
  group: ConversationGroup;
  channel: ChatChannelId;
  /** Which demo day the messages were sent on. */
  day: keyof typeof DAYS;
  name: string;
  isUnread: boolean;
  isOnline: boolean;
  unreadCount: number;
  contact: {
    company: string;
    email: string;
    phone: string;
    website: string;
    location: string;
    timezone: string;
    status: ContactStatus;
    /** A calendar day, formatted in the active language. */
    qualifiedOn: string;
    tags: ChatTagId[];
  };
  /** `at` is the UTC clock time on the seed's day. */
  messages: { id: number; align: "start" | "end"; at: string; reaction?: string }[];
};

const conversationSeeds: ConversationSeed[] = [
  {
    id: 1,
    group: "pinned",
    channel: "email",
    day: "today",
    name: "Olivia Rhye",
    isUnread: true,
    isOnline: true,
    unreadCount: 4,
    contact: {
      company: "Railway Systems Inc.",
      email: "olivia.rhye@weblabs.studio",
      phone: "+1 (415) 555-0123",
      website: "railway.co",
      location: "San Francisco, CA, USA",
      timezone: "PDT (UTC-7)",
      status: "lead",
      qualifiedOn: "2026-03-05",
      tags: ["devops", "enterprise", "p0"],
    },
    messages: [
      { id: 101, align: "start", at: "11:50" },
      { id: 102, align: "end", at: "11:52" },
      { id: 103, align: "start", at: "11:55" },
      { id: 104, align: "end", at: "11:57", reaction: "👍" },
      { id: 105, align: "start", at: "11:59", reaction: "👀" },
    ],
  },
  {
    id: 2,
    group: "pinned",
    channel: "email",
    day: "today",
    name: "Phoenix Baker",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "Meridian Retail Group",
      email: "phoenix.baker@weblabs.studio",
      phone: "+1 (312) 555-0184",
      website: "meridianretail.com",
      location: "Chicago, IL, USA",
      timezone: "CDT (UTC-5)",
      status: "customer",
      qualifiedOn: "2026-01-18",
      tags: ["billing", "enterprise"],
    },
    messages: [
      { id: 201, align: "start", at: "11:51" },
      { id: 202, align: "end", at: "11:52" },
      { id: 203, align: "start", at: "11:53" },
      { id: 204, align: "end", at: "11:54", reaction: "👍" },
      { id: 205, align: "start", at: "11:55", reaction: "✅" },
    ],
  },
  {
    id: 3,
    group: "pinned",
    channel: "chat",
    day: "today",
    name: "Lana Steiner",
    isUnread: true,
    isOnline: false,
    unreadCount: 2,
    contact: {
      company: "Monsoon Analytics",
      email: "lana.steiner@acme.inc",
      phone: "+91 98765 43210",
      website: "monsoonanalytics.in",
      location: "Bengaluru, India",
      timezone: "IST (UTC+5:30)",
      status: "qualified",
      qualifiedOn: "2026-04-02",
      tags: ["iam", "enterprise", "highValue"],
    },
    messages: [
      { id: 301, align: "start", at: "11:48" },
      { id: 302, align: "end", at: "11:49" },
      { id: 303, align: "start", at: "11:50" },
      { id: 304, align: "end", at: "11:51", reaction: "🙌" },
      { id: 305, align: "start", at: "11:52", reaction: "🎉" },
    ],
  },
  {
    id: 5,
    group: "today",
    channel: "whatsapp",
    day: "today",
    name: "Demi Wilkinson",
    isUnread: true,
    isOnline: true,
    unreadCount: 5,
    contact: {
      company: "BrightFuture Co.",
      email: "demi.wilkinson@weblabs.studio",
      phone: "+1 (415) 555-0189",
      website: "brightfuture.co",
      location: "San Francisco, CA, USA",
      timezone: "PDT (UTC-7)",
      status: "qualified",
      qualifiedOn: "2026-01-22",
      tags: ["sustainability", "enterprise", "finserv"],
    },
    messages: [
      { id: 501, align: "start", at: "10:42" },
      { id: 502, align: "end", at: "10:44" },
      { id: 503, align: "start", at: "10:47" },
      { id: 504, align: "end", at: "10:49", reaction: "👍" },
      { id: 505, align: "start", at: "10:50" },
    ],
  },
  {
    id: 6,
    group: "today",
    channel: "email",
    day: "today",
    name: "Candice Wu",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "Harbor Ops",
      email: "candice.wu@sandbox.dev",
      phone: "+1 (206) 555-0172",
      website: "harborops.com",
      location: "Seattle, WA, USA",
      timezone: "PDT (UTC-7)",
      status: "lead",
      qualifiedOn: "2026-05-10",
      tags: ["data", "performance"],
    },
    messages: [
      { id: 601, align: "start", at: "10:06" },
      { id: 602, align: "end", at: "10:09" },
      { id: 603, align: "start", at: "10:12" },
      { id: 604, align: "end", at: "10:15", reaction: "✅" },
    ],
  },
  {
    id: 7,
    group: "today",
    channel: "instagram",
    day: "today",
    name: "Natali Craig",
    isUnread: true,
    isOnline: false,
    unreadCount: 1,
    contact: {
      company: "Lumen Studio",
      email: "natali.craig@weblabs.studio",
      phone: "+39 02 5555 0184",
      website: "lumenstudio.co",
      location: "Milan, Italy",
      timezone: "CEST (UTC+2)",
      status: "customer",
      qualifiedOn: "2025-10-14",
      tags: ["billing", "smb"],
    },
    messages: [
      { id: 701, align: "start", at: "09:46" },
      { id: 702, align: "end", at: "09:50" },
      { id: 703, align: "start", at: "09:54" },
      { id: 704, align: "end", at: "09:58", reaction: "🙏" },
    ],
  },
  {
    id: 8,
    group: "today",
    channel: "chat",
    day: "today",
    name: "Drew Cano",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "AtlasWorks",
      email: "drew.cano@internal.tools",
      phone: "+1 (512) 555-0166",
      website: "atlasworks.co",
      location: "Austin, TX, USA",
      timezone: "CDT (UTC-5)",
      status: "customer",
      qualifiedOn: "2025-08-03",
      tags: ["onboarding", "platform", "npsPromoter"],
    },
    messages: [
      { id: 801, align: "start", at: "09:20" },
      { id: 802, align: "end", at: "09:24" },
      { id: 803, align: "start", at: "09:28" },
      { id: 804, align: "end", at: "09:32", reaction: "👍" },
    ],
  },
  {
    id: 9,
    group: "today",
    channel: "facebook",
    day: "today",
    name: "Orlando Diggs",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "Northstar Workspace",
      email: "orlando.diggs@acme.inc",
      phone: "+1 (720) 555-0195",
      website: "northstarworkspace.com",
      location: "Denver, CO, USA",
      timezone: "MDT (UTC-6)",
      status: "atRisk",
      qualifiedOn: "2025-12-01",
      tags: ["churnRisk", "enterprise", "downgrade"],
    },
    messages: [
      { id: 901, align: "start", at: "09:00" },
      { id: 902, align: "end", at: "09:04" },
      { id: 903, align: "start", at: "09:08" },
      { id: 904, align: "end", at: "09:12" },
    ],
  },
  {
    id: 10,
    group: "today",
    channel: "email",
    day: "today",
    name: "Andi Lane",
    isUnread: true,
    isOnline: true,
    unreadCount: 3,
    contact: {
      company: "LedgerLoop",
      email: "andi.lane@weblabs.studio",
      phone: "+353 1 555 0189",
      website: "ledgerloop.io",
      location: "Dublin, Ireland",
      timezone: "IST (UTC+1)",
      status: "lead",
      qualifiedOn: "2026-04-19",
      tags: ["api", "scaling", "enterprise"],
    },
    messages: [
      { id: 1001, align: "start", at: "08:35" },
      { id: 1002, align: "end", at: "08:39" },
      { id: 1003, align: "start", at: "08:43" },
      { id: 1004, align: "end", at: "08:47" },
    ],
  },
  {
    id: 11,
    group: "today",
    channel: "phone",
    day: "today",
    name: "Kate Morrison",
    isUnread: true,
    isOnline: false,
    unreadCount: 6,
    contact: {
      company: "Storefront Labs",
      email: "kate.morrison@weblabs.studio",
      phone: "+1 (213) 555-0192",
      website: "storefrontlabs.com",
      location: "Los Angeles, CA, USA",
      timezone: "PDT (UTC-7)",
      status: "customer",
      qualifiedOn: "2026-06-02",
      tags: ["urgent", "smb", "ssl"],
    },
    messages: [
      { id: 1101, align: "start", at: "07:53" },
      { id: 1102, align: "end", at: "07:57" },
      { id: 1103, align: "start", at: "08:01" },
      { id: 1104, align: "end", at: "08:05", reaction: "⚡" },
    ],
  },
  {
    id: 12,
    group: "today",
    channel: "email",
    day: "today",
    name: "Alec Whitten",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "Crescent Media Group",
      email: "alec.whitten@internal.tools",
      phone: "+974 4455 1234",
      website: "crescentmedia.qa",
      location: "Doha, Qatar",
      timezone: "AST (UTC+3)",
      status: "qualified",
      qualifiedOn: "2026-05-28",
      tags: ["upgrade", "enterprise", "media"],
    },
    messages: [
      { id: 1201, align: "start", at: "07:26" },
      { id: 1202, align: "end", at: "07:30" },
      { id: 1203, align: "start", at: "07:34" },
      { id: 1204, align: "end", at: "07:38", reaction: "✅" },
    ],
  },
  {
    id: 13,
    group: "today",
    channel: "chat",
    day: "today",
    name: "Ariana Decker",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "Northstar Health",
      email: "ariana.decker@weblabs.studio",
      phone: "+1 (617) 555-0188",
      website: "northstarhealth.com",
      location: "Boston, MA, USA",
      timezone: "EDT (UTC-4)",
      status: "customer",
      qualifiedOn: "2026-03-14",
      tags: ["bug", "reports"],
    },
    messages: [
      { id: 1301, align: "start", at: "06:40" },
      { id: 1302, align: "end", at: "06:44" },
      { id: 1303, align: "start", at: "06:48" },
      { id: 1304, align: "end", at: "06:52" },
    ],
  },
  {
    id: 14,
    group: "today",
    channel: "whatsapp",
    day: "today",
    name: "Steven Tey",
    isUnread: true,
    isOnline: true,
    unreadCount: 2,
    contact: {
      company: "BridgeWork Inc.",
      email: "steven.tey@sandbox.dev",
      phone: "+1 (404) 555-0141",
      website: "bridgework.io",
      location: "Atlanta, GA, USA",
      timezone: "EDT (UTC-4)",
      status: "lead",
      qualifiedOn: "2026-04-08",
      tags: ["integrations", "platform", "zapier"],
    },
    messages: [
      { id: 1401, align: "start", at: "05:58" },
      { id: 1402, align: "end", at: "06:02" },
      { id: 1403, align: "start", at: "06:06" },
      { id: 1404, align: "end", at: "06:10" },
    ],
  },
  {
    id: 15,
    group: "today",
    channel: "email",
    day: "today",
    name: "Lori Bryson",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "KumoWorks K.K.",
      email: "lori.bryson@acme.inc",
      phone: "+81 3 5555 0173",
      website: "kumoworks.jp",
      location: "Tokyo, Japan",
      timezone: "JST (UTC+9)",
      status: "qualified",
      qualifiedOn: "2026-02-09",
      tags: ["rbac", "enterprise", "featureRequest"],
    },
    messages: [
      { id: 1501, align: "start", at: "05:32" },
      { id: 1502, align: "end", at: "05:36" },
      { id: 1503, align: "start", at: "05:40" },
      { id: 1504, align: "end", at: "05:44" },
    ],
  },
  {
    id: 16,
    group: "today",
    channel: "instagram",
    day: "today",
    name: "Koray Okumus",
    isUnread: true,
    isOnline: false,
    unreadCount: 3,
    contact: {
      company: "MobiSolar Ltd.",
      email: "koray.okumus@weblabs.studio",
      phone: "+254 711 555 0182",
      website: "mobisolar.co.ke",
      location: "Nairobi, Kenya",
      timezone: "EAT (UTC+3)",
      status: "customer",
      qualifiedOn: "2026-01-05",
      tags: ["mobile", "android", "bug"],
    },
    messages: [
      { id: 1601, align: "start", at: "04:40" },
      { id: 1602, align: "end", at: "04:52" },
      { id: 1603, align: "start", at: "05:05" },
      { id: 1604, align: "end", at: "05:18" },
    ],
  },
  {
    id: 17,
    group: "yesterday",
    channel: "chat",
    day: "yesterday",
    name: "Josh Miller",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "Nexo Digital MX",
      email: "josh.miller@internal.tools",
      phone: "+52 55 5555 0165",
      website: "nexodigital.mx",
      location: "Mexico City, Mexico",
      timezone: "CST (UTC-6)",
      status: "lead",
      qualifiedOn: "2026-05-15",
      tags: ["partnership", "latam", "reseller"],
    },
    messages: [
      { id: 1701, align: "start", at: "17:00" },
      { id: 1702, align: "end", at: "17:10" },
      { id: 1703, align: "start", at: "17:25" },
      { id: 1704, align: "end", at: "17:40" },
    ],
  },
  {
    id: 18,
    group: "yesterday",
    channel: "email",
    day: "yesterday",
    name: "Mollie Hall",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "NovaPay Ltd.",
      email: "mollie.hall@weblabs.studio",
      phone: "+44 20 5555 0178",
      website: "novapay.co.uk",
      location: "London, UK",
      timezone: "BST (UTC+1)",
      status: "customer",
      qualifiedOn: "2025-11-08",
      tags: ["compliance", "finserv", "audit"],
    },
    messages: [
      { id: 1801, align: "start", at: "16:00" },
      { id: 1802, align: "end", at: "16:10" },
      { id: 1803, align: "start", at: "16:25" },
      { id: 1804, align: "end", at: "16:40" },
    ],
  },
  {
    id: 19,
    group: "yesterday",
    channel: "facebook",
    day: "yesterday",
    name: "Rene Wells",
    isUnread: true,
    isOnline: true,
    unreadCount: 1,
    contact: {
      company: "Jambo Digital KE",
      email: "rene.wells@acme.inc",
      phone: "+254 722 555 0194",
      website: "jambodigital.ke",
      location: "Nairobi, Kenya",
      timezone: "EAT (UTC+3)",
      status: "qualified",
      qualifiedOn: "2026-04-25",
      tags: ["whiteLabel", "reseller", "platform"],
    },
    messages: [
      { id: 1901, align: "start", at: "15:00" },
      { id: 1902, align: "end", at: "15:10" },
      { id: 1903, align: "start", at: "15:25" },
      { id: 1904, align: "end", at: "15:40" },
    ],
  },
  {
    id: 20,
    group: "yesterday",
    channel: "phone",
    day: "yesterday",
    name: "Rylee Howard",
    isUnread: false,
    isOnline: false,
    unreadCount: 0,
    contact: {
      company: "Grupo Financiero Sur",
      email: "rylee.howard@sandbox.dev",
      phone: "+57 601 555 0180",
      website: "gfsur.com.co",
      location: "Bogotá, Colombia",
      timezone: "COT (UTC-5)",
      status: "qualified",
      qualifiedOn: "2026-03-30",
      tags: ["security", "enterprise", "mfa"],
    },
    messages: [
      { id: 2001, align: "start", at: "14:00" },
      { id: 2002, align: "end", at: "14:10" },
      { id: 2003, align: "start", at: "14:25" },
      { id: 2004, align: "end", at: "14:40" },
    ],
  },
  {
    id: 21,
    group: "yesterday",
    channel: "email",
    day: "yesterday",
    name: "Sienna Hewitt",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "Volta Energy AB",
      email: "sienna.hewitt@weblabs.studio",
      phone: "+46 73 555 0168",
      website: "voltaenergy.se",
      location: "Malmö, Sweden",
      timezone: "CEST (UTC+2)",
      status: "customer",
      qualifiedOn: "2025-09-12",
      tags: ["billing", "export", "bug"],
    },
    messages: [
      { id: 2101, align: "start", at: "13:00" },
      { id: 2102, align: "end", at: "13:10" },
      { id: 2103, align: "start", at: "13:25" },
      { id: 2104, align: "end", at: "13:40" },
    ],
  },
  {
    id: 22,
    group: "yesterday",
    channel: "chat",
    day: "yesterday",
    name: "Noah Pierre",
    isUnread: true,
    isOnline: false,
    unreadCount: 5,
    contact: {
      company: "First Atlantic Bank NG",
      email: "noah.pierre@weblabs.studio",
      phone: "+234 805 555 0125",
      website: "firstatlanticbank.ng",
      location: "Abuja, Nigeria",
      timezone: "WAT (UTC+1)",
      status: "lead",
      qualifiedOn: "2026-05-20",
      tags: ["demo", "finserv", "enterprise"],
    },
    messages: [
      { id: 2201, align: "start", at: "12:00" },
      { id: 2202, align: "end", at: "12:10" },
      { id: 2203, align: "start", at: "12:25" },
      { id: 2204, align: "end", at: "12:40" },
    ],
  },
  {
    id: 23,
    group: "yesterday",
    channel: "whatsapp",
    day: "yesterday",
    name: "Eve Lechner",
    isUnread: false,
    isOnline: true,
    unreadCount: 0,
    contact: {
      company: "Northlane IT",
      email: "eve.lechner@acme.inc",
      phone: "+420 222 555 013",
      website: "northlaneit.com",
      location: "Prague, Czechia",
      timezone: "CEST (UTC+2)",
      status: "qualified",
      qualifiedOn: "2026-02-14",
      tags: ["sso", "azure", "enterprise"],
    },
    messages: [
      { id: 2301, align: "start", at: "11:00" },
      { id: 2302, align: "end", at: "11:10" },
      { id: 2303, align: "start", at: "11:25" },
      { id: 2304, align: "end", at: "11:40" },
    ],
  },
  {
    id: 24,
    group: "yesterday",
    channel: "email",
    day: "yesterday",
    name: "Zahir McClure",
    isUnread: true,
    isOnline: true,
    unreadCount: 2,
    contact: {
      company: "Cedar Grove Ventures",
      email: "zahir.mcclure@internal.tools",
      phone: "+1 (615) 555-0175",
      website: "cedargrove.vc",
      location: "Nashville, TN, USA",
      timezone: "CDT (UTC-5)",
      status: "atRisk",
      qualifiedOn: "2025-06-15",
      tags: ["churnRisk", "account", "smb"],
    },
    messages: [
      { id: 2401, align: "start", at: "10:00" },
      { id: 2402, align: "end", at: "10:10" },
      { id: 2403, align: "start", at: "10:25" },
      { id: 2404, align: "end", at: "10:40" },
    ],
  },
];

const MINUTE = 60_000;

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10);
}

function clockOrYesterday(at: number, now: number, locale: Locale, text: ChatMessages["time"]): string {
  return isSameDay(at, now) ? formatTime(at, locale, CHAT_TIME_ZONE) : text.yesterday;
}

/** Compact time for the list: minutes while fresh, the clock time later today, "Yesterday" after that. */
export function listTime(at: number, now: number, locale: Locale, text: ChatMessages["time"]): string {
  const minutes = Math.floor((now - at) / MINUTE);
  if (minutes < 2) {
    return text.justNow;
  }
  if (minutes < 60) {
    return format(text.minutesShort, locale, { count: minutes });
  }
  return clockOrYesterday(at, now, locale, text);
}

/** Time under a message: "10 minutes ago" while fresh, then the clock time, and "Yesterday" for the day before. */
export function messageTime(at: number, now: number, locale: Locale, text: ChatMessages["time"]): string {
  if (now - at < 60 * MINUTE) {
    return formatRelative(at, now, locale);
  }
  return clockOrYesterday(at, now, locale, text);
}

function messageText(messages: readonly string[], index: number, conversationId: ConversationId): string {
  const text = messages[index];
  if (text === undefined) {
    throw new Error(`Conversation ${conversationId} has no translation for message ${index}.`);
  }
  return text;
}

/**
 * The demo conversations with their text in one language. An untranslated conversation or message fails loudly
 * instead of rendering a blank.
 */
export function createConversations(text: ChatMessages, locale: Locale): Conversation[] {
  return conversationSeeds.map((seed) => {
    const words = text.demo[seed.id];
    const stamps = seed.messages.map((message) => Date.parse(`${DAYS[seed.day]}T${message.at}:00Z`));
    const last = stamps[stamps.length - 1] ?? CHAT_NOW;

    return {
      id: seed.id,
      group: seed.group,
      channel: seed.channel,
      status: "open",
      isPriority: false,
      isBlocked: false,
      tagIds: [...seed.contact.tags],
      name: seed.name,
      subject: words.subject,
      preview: words.preview,
      time: listTime(last, CHAT_NOW, locale, text.time),
      dayLabel: formatCalendarDate(DAYS[seed.day], locale, { dateStyle: "long" }),
      isUnread: seed.isUnread,
      isOnline: seed.isOnline,
      unreadCount: seed.unreadCount,
      contact: {
        name: seed.name,
        role: words.role,
        company: seed.contact.company,
        email: seed.contact.email,
        phone: seed.contact.phone,
        website: seed.contact.website,
        location: seed.contact.location,
        timezone: seed.contact.timezone,
        status: text.status[seed.contact.status],
        qualifiedAt: formatCalendarDate(seed.contact.qualifiedOn, locale, { dateStyle: "medium" }),
      },
      messages: seed.messages.map((message, index) => ({
        id: message.id,
        align: message.align,
        text: messageText(words.messages, index, seed.id),
        time: messageTime(stamps[index] ?? CHAT_NOW, CHAT_NOW, locale, text.time),
        reaction: message.reaction,
      })),
    };
  });
}
