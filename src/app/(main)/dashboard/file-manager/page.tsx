import Link from "next/link";

import { Grid2X2, List } from "lucide-react";

import { LocaleBundles } from "@/app/_components/locale-root";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getLocale } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { type FileManagerView, fileRecords, folderRecords } from "./_components/data";
import { toFileRows, toFolderRows } from "./_components/file-format";
import { FileGridView } from "./_components/file-grid-view";
import { FileListView } from "./_components/file-list-view";
import { FoldersSection } from "./_components/folders-section";
import { fileManagerBundle, fileManagerMessages } from "./_components/messages.server";

export const generateMetadata = () => pageMetadata("/dashboard/file-manager", fileManagerMessages);

interface PageProps {
  searchParams: Promise<{ view?: string | string[] }>;
}

export default async function Page({ searchParams }: PageProps) {
  const [{ view }, locale] = await Promise.all([searchParams, getLocale()]);
  const text = fileManagerMessages[locale];
  const activeView: FileManagerView = view === "list" ? "list" : "grid";
  // Names, sizes and times are written here, in the request's language, before they reach a client component.
  const folders = toFolderRows(folderRecords, text.names.folders, locale);
  const files = toFileRows(fileRecords, text.names.files, locale);

  return (
    <LocaleBundles bundles={[fileManagerBundle]}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-3xl leading-none tracking-tight">{text.title}</h1>
            <p className="text-muted-foreground text-sm">{text.subtitle}</p>
          </div>
        </div>
        <FoldersSection folders={folders} />
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="min-w-0 text-lg font-medium">{text.files.title}</h2>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              spacing={0}
              value={activeView}
              aria-label={text.files.viewLabel}
              className="shrink-0"
            >
              <ToggleGroupItem value="grid" asChild>
                <Link href="?view=grid" prefetch={false} replace scroll={false}>
                  <Grid2X2 />
                  {text.files.gridView}
                </Link>
              </ToggleGroupItem>
              <ToggleGroupItem value="list" asChild>
                <Link href="?view=list" prefetch={false} replace scroll={false}>
                  <List />
                  {text.files.listView}
                </Link>
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {activeView === "list" ? <FileListView files={files} /> : <FileGridView files={files} />}
        </div>
      </div>
    </LocaleBundles>
  );
}
