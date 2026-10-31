import { Clock, Folder, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { getLocale } from "@/config/locale.server";
import { format } from "@/core/i18n/client";

import type { FileManagerFolder } from "./data";
import { fileManagerMessages } from "./messages.server";

interface FoldersSectionProps {
  folders: FileManagerFolder[];
}

export async function FoldersSection({ folders }: FoldersSectionProps) {
  const locale = await getLocale();
  const text = fileManagerMessages[locale].folders;

  return (
    <section className="flex flex-col gap-2" aria-labelledby="folders-heading">
      <div className="flex items-center justify-between gap-4">
        <h2 id="folders-heading" className="min-w-0 text-lg font-medium">
          {text.title}
        </h2>
        <span className="text-muted-foreground shrink-0 text-sm">
          {format(text.count, locale, { count: folders.length })}
        </span>
      </div>
      {folders.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {folders.map((folder) => (
            <Card key={folder.id} size="sm">
              <CardHeader>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <Folder className="size-4.5" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <CardTitle
                      className="line-clamp-2 block w-full leading-tight break-words hyphens-auto"
                      title={folder.name}
                    >
                      {folder.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {format(text.files, locale, { count: folder.fileCount })}
                    </CardDescription>
                  </div>
                </div>
                <CardAction>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={format(text.actionsFor, locale, { name: folder.name })}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuGroup>
                        <DropdownMenuItem>{text.open}</DropdownMenuItem>
                        <DropdownMenuItem>{text.copyLink}</DropdownMenuItem>
                        <DropdownMenuItem>{text.rename}</DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardAction>
              </CardHeader>
              <CardContent className="text-muted-foreground flex items-start justify-between gap-3 text-xs">
                <div className="flex min-w-0 items-start gap-1.5">
                  <Clock className="mt-0.5 size-3.5 shrink-0" />
                  <span className="break-words">{format(text.updated, locale, { when: folder.updated })}</span>
                </div>
                <span className="shrink-0 tabular-nums">{folder.size}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="min-h-32">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Folder />
            </EmptyMedia>
            <EmptyTitle>{text.emptyTitle}</EmptyTitle>
            <EmptyDescription>{text.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
