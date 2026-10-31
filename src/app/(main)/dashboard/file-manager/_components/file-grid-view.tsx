"use client";

import { useState } from "react";

import { cn } from "cn";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { type FileManagerFile, fileIcons } from "./data";
import { FileActions } from "./file-actions";
import { fileManagerMessageKey } from "./messages";

interface FileGridViewProps {
  files: FileManagerFile[];
}

export function FileGridView({ files }: FileGridViewProps) {
  const text = useMessages(fileManagerMessageKey);
  const locale = useLocale();
  const [gridFiles, setGridFiles] = useState(files);

  function toggleStar(fileId: string) {
    setGridFiles((current) => current.map((file) => (file.id === fileId ? { ...file, starred: !file.starred } : file)));
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {gridFiles.map((file) => {
        const FileIcon = fileIcons[file.kind];

        return (
          <Card key={file.id} size="sm" className="group/file">
            <CardContent>
              <div className="bg-muted/50 relative flex h-36 items-center justify-center rounded-lg">
                <FileIcon className="text-muted-foreground size-12" aria-hidden="true" />
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className={cn(
                    "absolute top-2 right-2 opacity-0 group-hover/file:opacity-100 focus-visible:opacity-100",
                    file.starred && "opacity-100",
                  )}
                  aria-label={format(file.starred ? text.files.unstar : text.files.star, locale, { name: file.name })}
                  onClick={() => toggleStar(file.id)}
                >
                  <Star className={cn(file.starred && "fill-current")} />
                </Button>
                <div className="text-muted-foreground absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 break-words">{text.kinds[file.kind]}</span>
                  <span className="shrink-0 tabular-nums">{file.size}</span>
                </div>
              </div>
            </CardContent>
            <CardHeader>
              <CardTitle className="line-clamp-2 block w-full break-words hyphens-auto" title={file.name}>
                {file.name}
              </CardTitle>
              <CardDescription className="line-clamp-2 break-words hyphens-auto">
                {format(text.files.modifiedBy, locale, { when: file.modified, owner: file.owner })}
              </CardDescription>
              <CardAction>
                <FileActions file={file} onToggleStar={() => toggleStar(file.id)} />
              </CardAction>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
