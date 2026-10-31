import { File, FileArchive, FileChartColumn, FileImage, FileText } from "lucide-react";

export const fileKinds = ["archive", "design", "document", "pdf", "spreadsheet"] as const;
export type FileKind = (typeof fileKinds)[number];
export type FileManagerView = "grid" | "list";

export const fileIcons = {
  archive: FileArchive,
  design: FileImage,
  document: FileText,
  pdf: File,
  spreadsheet: FileChartColumn,
} satisfies Record<FileKind, typeof File>;

export type FolderId =
  | "brand-assets"
  | "product-design"
  | "legal-documents"
  | "research"
  | "marketing"
  | "team-resources";

export type FileId =
  | "product-roadmap"
  | "design-system"
  | "campaign-performance"
  | "research-notes"
  | "release-assets"
  | "handoff-checklist"
  | "quarterly-budget"
  | "mobile-app-prototype"
  | "partnership-agreement"
  | "product-launch-brief"
  | "brand-exports";

/** The demo workspace's "now": relative times and dates below are measured against it. */
export const FILES_AS_OF = "2026-10-31T18:00:00Z";

/** Raw demo records: names come from the dictionary, sizes are bytes and times are ISO instants. */
export interface FolderRecord {
  id: FolderId;
  fileCount: number;
  bytes: number;
  updatedAt: string;
}

export interface FileRecord {
  id: FileId;
  kind: FileKind;
  bytes: number;
  owner: string;
  ownerInitials: string;
  modifiedAt: string;
  shared: boolean;
  starred: boolean;
}

/** What the screen renders: names, sizes and times already written for the request's language. */
export interface FileManagerFolder {
  id: FolderId;
  name: string;
  fileCount: number;
  size: string;
  updated: string;
}

export interface FileManagerFile {
  id: FileId;
  name: string;
  kind: FileKind;
  size: string;
  owner: string;
  ownerInitials: string;
  modified: string;
  shared: boolean;
  starred: boolean;
}

export const folderRecords: FolderRecord[] = [
  { id: "brand-assets", fileCount: 24, bytes: 1_800_000_000, updatedAt: "2026-10-31T17:48:00Z" },
  { id: "product-design", fileCount: 38, bytes: 4_600_000_000, updatedAt: "2026-10-30T14:00:00Z" },
  { id: "legal-documents", fileCount: 16, bytes: 840_000_000, updatedAt: "2026-10-26T09:30:00Z" },
  { id: "research", fileCount: 11, bytes: 620_000_000, updatedAt: "2026-10-24T11:15:00Z" },
  { id: "marketing", fileCount: 29, bytes: 2_300_000_000, updatedAt: "2026-10-22T16:40:00Z" },
  { id: "team-resources", fileCount: 18, bytes: 1_200_000_000, updatedAt: "2026-10-19T08:20:00Z" },
];

export const fileRecords: FileRecord[] = [
  {
    id: "product-roadmap",
    kind: "pdf",
    bytes: 8_400_000,
    owner: "Alex Morgan",
    ownerInitials: "AK",
    modifiedAt: "2026-10-31T17:55:00Z",
    shared: true,
    starred: true,
  },
  {
    id: "design-system",
    kind: "design",
    bytes: 24_100_000,
    owner: "Aiy",
    ownerInitials: "AY",
    modifiedAt: "2026-10-31T16:00:00Z",
    shared: true,
    starred: false,
  },
  {
    id: "campaign-performance",
    kind: "spreadsheet",
    bytes: 2_700_000,
    owner: "Ammar Khan",
    ownerInitials: "AM",
    modifiedAt: "2026-10-30T12:00:00Z",
    shared: false,
    starred: false,
  },
  {
    id: "research-notes",
    kind: "document",
    bytes: 1_200_000,
    owner: "Aiy",
    ownerInitials: "AY",
    modifiedAt: "2026-10-26T10:00:00Z",
    shared: true,
    starred: true,
  },
  {
    id: "release-assets",
    kind: "archive",
    bytes: 186_000_000,
    owner: "Alex Morgan",
    ownerInitials: "AK",
    modifiedAt: "2026-10-25T15:30:00Z",
    shared: false,
    starred: false,
  },
  {
    id: "handoff-checklist",
    kind: "pdf",
    bytes: 940_000,
    owner: "Ammar Khan",
    ownerInitials: "AM",
    modifiedAt: "2026-10-23T09:10:00Z",
    shared: true,
    starred: false,
  },
  {
    id: "quarterly-budget",
    kind: "spreadsheet",
    bytes: 3_800_000,
    owner: "Alex Morgan",
    ownerInitials: "AK",
    modifiedAt: "2026-10-21T13:45:00Z",
    shared: true,
    starred: false,
  },
  {
    id: "mobile-app-prototype",
    kind: "design",
    bytes: 18_600_000,
    owner: "Ammar Khan",
    ownerInitials: "AM",
    modifiedAt: "2026-10-20T17:05:00Z",
    shared: true,
    starred: true,
  },
  {
    id: "partnership-agreement",
    kind: "document",
    bytes: 620_000,
    owner: "Ammar Khan",
    ownerInitials: "AM",
    modifiedAt: "2026-10-18T11:20:00Z",
    shared: false,
    starred: false,
  },
  {
    id: "product-launch-brief",
    kind: "pdf",
    bytes: 4_200_000,
    owner: "Alex Morgan",
    ownerInitials: "AK",
    modifiedAt: "2026-10-16T14:00:00Z",
    shared: true,
    starred: false,
  },
  {
    id: "brand-exports",
    kind: "archive",
    bytes: 72_000_000,
    owner: "Alex Morgan",
    ownerInitials: "AK",
    modifiedAt: "2026-10-14T10:30:00Z",
    shared: false,
    starred: false,
  },
];
