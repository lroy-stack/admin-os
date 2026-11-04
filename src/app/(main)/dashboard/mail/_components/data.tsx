import { Archive, File, Inbox, type LucideIcon, Send, Star, Trash2 } from "lucide-react";
import { siFigma, siGoogledocs, siGooglephotos } from "simple-icons";

import { format, type Locale } from "@/core/i18n/client";

import type { MailMessages } from "./messages";

const alexMorgan = {
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
};

const weblabsStudio = {
  name: "Weblabs Studio",
  email: "contact@weblabs.studio",
};

export type Recipient = {
  name: string;
  email: string;
};

/** A reply written in the session; it joins the thread of the message it answers. */
export type MailReply = {
  id: string;
  from: Recipient;
  to: Recipient[];
  body: string;
  sentAt: string;
};

export const MAIL_IDS = [
  "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
  "110e8400-e29b-11d4-a716-446655440000",
  "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
  "61c35085-72d7-42b4-8d62-738f700d4b92",
  "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97",
  "1f0f2c02-e299-40de-9b1d-86ef9e42126b",
  "17c0a96d-4415-42b1-8b4f-764efab57f66",
  "2f0130cb-39fc-44c4-bb3c-0a4337edaaab",
  "de305d54-75b4-431b-adb2-eb6b9e546014",
  "7dd90c63-00f6-40f3-bd87-5060a24e8ee7",
  "99a88f78-3eb4-4d87-87b7-7b15a49a0a05",
  "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6",
  "ba54eefd-4097-4949-99f2-2a9ae4d1a836",
  "df09b6ed-28bd-4e0c-85a9-9320ec5179aa",
  "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d",
  "6c9a7f94-8329-4d70-95d3-51f68c186ae1",
] as const;

export type MailId = (typeof MAIL_IDS)[number];

export type AttachmentId =
  | "admin-os-fig"
  | "features-docx"
  | "preview-png"
  | "project-notes-docx"
  | "budget-analysis-docx"
  | "proposal-layout-fig"
  | "conference-schedule-png";

export type Attachment = {
  id: AttachmentId;
  name: string;
  /** The size as it reads in the active language, for example "3.7 MB" or "3,7 Mo". */
  size: string;
  icon: typeof siFigma;
};

/** The labels a message can carry; the dictionary names each one. */
export const MAIL_LABELS = ["meeting", "work", "important", "personal", "budget", "conference", "travel"] as const;

export type MailLabelId = (typeof MAIL_LABELS)[number];

export type Mail = {
  /** A demo mail's id is one of `MAIL_IDS`; a message written in the session has its own. */
  id: string;
  accountId: number;
  from: Recipient;
  to: Recipient[];
  cc?: Recipient[];
  subject: string;
  body: string;
  receivedAt: string;
  folder: "inbox" | "drafts" | "sent" | "archive" | "trash";
  isRead: boolean;
  isPinned: boolean;
  isPriority: boolean;
  labels: MailLabelId[];
  attachments?: Attachment[];
  /** The replies of the session, oldest first. */
  replies?: MailReply[];
  messageCount?: number;
};

type AttachmentSeed = {
  id: AttachmentId;
  size: { unit: "kb" | "mb"; value: number };
  icon: typeof siFigma;
};

type MailSeed = Omit<Mail, "subject" | "body" | "receivedAt" | "attachments"> & {
  id: MailId;
  receivedMinutesAgo: number;
  attachments?: AttachmentSeed[];
};

const minutes = (value: number) => value;
const hours = (value: number) => value * 60;
const days = (value: number) => value * 24 * 60;

const mailSeeds: MailSeed[] = [
  {
    id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
    accountId: 1,
    from: { name: "William Smith", email: "williamsmith@example.com" },
    to: [alexMorgan],
    cc: [weblabsStudio],
    receivedMinutesAgo: minutes(24),
    folder: "inbox",
    isRead: true,
    isPinned: true,
    isPriority: true,
    labels: ["meeting", "work", "important"],
    attachments: [
      { id: "admin-os-fig", size: { unit: "mb", value: 21 }, icon: siFigma },
      { id: "features-docx", size: { unit: "mb", value: 3.7 }, icon: siGoogledocs },
      { id: "preview-png", size: { unit: "mb", value: 2.3 }, icon: siGooglephotos },
    ],
  },
  {
    id: "110e8400-e29b-11d4-a716-446655440000",
    accountId: 2,
    from: { name: "Alice Smith", email: "alicesmith@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: hours(2),
    folder: "inbox",
    isRead: true,
    isPinned: true,
    isPriority: false,
    labels: ["work", "important"],
    attachments: [{ id: "project-notes-docx", size: { unit: "mb", value: 1.8 }, icon: siGoogledocs }],
    messageCount: 3,
  },
  {
    id: "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
    accountId: 1,
    from: { name: "Bob Johnson", email: "bobjohnson@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(1),
    folder: "inbox",
    isRead: true,
    isPinned: true,
    isPriority: false,
    labels: ["personal"],
  },
  {
    id: "61c35085-72d7-42b4-8d62-738f700d4b92",
    accountId: 1,
    from: { name: "Emily Davis", email: "emilydavis@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(2),
    folder: "inbox",
    isRead: false,
    isPinned: true,
    isPriority: true,
    labels: ["work", "budget"],
    attachments: [{ id: "budget-analysis-docx", size: { unit: "mb", value: 2.1 }, icon: siGoogledocs }],
    messageCount: 2,
  },
  {
    id: "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97",
    accountId: 2,
    from: { name: "Michael Wilson", email: "michaelwilson@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(3),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: true,
    labels: ["meeting", "work", "important"],
  },
  {
    id: "1f0f2c02-e299-40de-9b1d-86ef9e42126b",
    accountId: 1,
    from: { name: "Sarah Brown", email: "sarahbrown@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(5),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["work"],
    attachments: [{ id: "proposal-layout-fig", size: { unit: "mb", value: 14 }, icon: siFigma }],
  },
  {
    id: "17c0a96d-4415-42b1-8b4f-764efab57f66",
    accountId: 2,
    from: { name: "David Lee", email: "davidlee@example.com" },
    to: [weblabsStudio],
    cc: [alexMorgan],
    receivedMinutesAgo: days(8),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["meeting", "work", "important"],
  },
  {
    id: "2f0130cb-39fc-44c4-bb3c-0a4337edaaab",
    accountId: 1,
    from: { name: "Olivia Wilson", email: "oliviawilson@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(12),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["personal"],
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546014",
    accountId: 2,
    from: { name: "James Martin", email: "jamesmartin@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(18),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["work", "conference"],
    attachments: [{ id: "conference-schedule-png", size: { unit: "kb", value: 860 }, icon: siGooglephotos }],
  },
  {
    id: "7dd90c63-00f6-40f3-bd87-5060a24e8ee7",
    accountId: 1,
    from: { name: "Sophia White", email: "sophiawhite@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(24),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["meeting", "work"],
  },
  {
    id: "99a88f78-3eb4-4d87-87b7-7b15a49a0a05",
    accountId: 2,
    from: { name: "Daniel Johnson", email: "danieljohnson@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(31),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["work"],
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    accountId: 1,
    from: { name: "Ava Taylor", email: "avataylor@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(45),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["meeting", "work"],
  },
  {
    id: "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6",
    accountId: 2,
    from: { name: "William Anderson", email: "williamanderson@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(62),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["meeting", "work", "important"],
  },
  {
    id: "ba54eefd-4097-4949-99f2-2a9ae4d1a836",
    accountId: 1,
    from: { name: "Mia Harris", email: "miaharris@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(75),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["personal", "travel"],
  },
  {
    id: "df09b6ed-28bd-4e0c-85a9-9320ec5179aa",
    accountId: 2,
    from: { name: "Ethan Clark", email: "ethanclark@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(92),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["meeting", "work"],
  },
  {
    id: "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d",
    accountId: 1,
    from: { name: "Chloe Hall", email: "chloehall@example.com" },
    to: [alexMorgan],
    receivedMinutesAgo: days(118),
    folder: "inbox",
    isRead: true,
    isPinned: false,
    isPriority: false,
    labels: ["work", "budget"],
  },
  {
    id: "6c9a7f94-8329-4d70-95d3-51f68c186ae1",
    accountId: 2,
    from: { name: "Samuel Turner", email: "samuelturner@example.com" },
    to: [weblabsStudio],
    receivedMinutesAgo: days(145),
    folder: "inbox",
    isRead: false,
    isPinned: false,
    isPriority: false,
    labels: ["personal"],
  },
];

/**
 * The demo mails with their text in one language. `now` is a parameter so the received times are relative to the
 * request, and an untranslated mail or attachment fails loudly instead of showing a blank.
 */
export function createMails(now: number, text: MailMessages, locale: Locale): Mail[] {
  return mailSeeds.map(({ receivedMinutesAgo, attachments, ...seed }) => ({
    ...seed,
    ...text.demo.mails[seed.id],
    receivedAt: new Date(now - receivedMinutesAgo * 60_000).toISOString(),
    attachments: attachments?.map(({ id, size, icon }) => ({
      id,
      icon,
      name: text.demo.attachments[id],
      size: format(text.size[size.unit], locale, { size: size.value }),
    })),
  }));
}

export type MailFolderId = "inbox" | "priority" | "drafts" | "sent" | "archive" | "trash";

export type MailNavItem = {
  id: MailFolderId;
  icon: LucideIcon;
};

type MailNavigation = {
  navMain: MailNavItem[];
  folders: MailNavItem[];
};

export const mailNavigation: MailNavigation = {
  navMain: [
    { id: "inbox", icon: Inbox },
    { id: "priority", icon: Star },
  ],
  folders: [
    { id: "drafts", icon: File },
    { id: "sent", icon: Send },
    { id: "archive", icon: Archive },
    { id: "trash", icon: Trash2 },
  ],
};

export const accounts = [
  {
    id: 1,
    label: "Alex Morgan",
    email: "alex.morgan@example.com",
  },
  {
    id: 2,
    label: "Weblabs Studio",
    email: "contact@weblabs.studio",
  },
];
