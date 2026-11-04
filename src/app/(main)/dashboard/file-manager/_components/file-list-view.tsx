"use client";

import { useState } from "react";

import { cn } from "cn";
import { Star } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { type FileManagerFile, fileIcons } from "./data";
import { fileManagerMessageKey } from "./messages";

interface FileListViewProps {
  files: FileManagerFile[];
}

export function FileListView({ files }: FileListViewProps) {
  const text = useMessages(fileManagerMessageKey);
  const locale = useLocale();
  const [listFiles, setListFiles] = useState(files);

  function toggleStar(fileId: string) {
    setListFiles((current) => current.map((file) => (file.id === fileId ? { ...file, starred: !file.starred } : file)));
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-0">{text.columns.name}</TableHead>
          <TableHead className="hidden md:table-cell">{text.columns.owner}</TableHead>
          <TableHead className="hidden lg:table-cell">{text.columns.modified}</TableHead>
          <TableHead className="hidden sm:table-cell">{text.columns.size}</TableHead>
          <TableHead className="w-20">
            <span className="sr-only">{text.columns.actions}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {listFiles.map((file) => {
          const FileIcon = fileIcons[file.kind];

          return (
            <TableRow key={file.id}>
              <TableCell className="pl-0">
                <div className="flex min-w-0 items-center gap-3">
                  <FileIcon className="text-muted-foreground size-5 shrink-0" />
                  <span
                    className="line-clamp-2 max-w-72 min-w-0 text-sm font-medium break-words hyphens-auto"
                    title={file.name}
                  >
                    {file.name}
                  </span>
                  {file.shared && (
                    <Badge variant="outline" className="hidden shrink-0 xl:inline-flex">
                      {text.files.shared}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{file.ownerInitials}</AvatarFallback>
                  </Avatar>
                  <span className="break-words">{file.owner}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground hidden lg:table-cell">{file.modified}</TableCell>
              <TableCell className="text-muted-foreground hidden whitespace-nowrap tabular-nums sm:table-cell">
                {file.size}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={format(file.starred ? text.files.unstar : text.files.star, locale, { name: file.name })}
                    onClick={() => toggleStar(file.id)}
                  >
                    <Star className={cn(file.starred && "fill-current")} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
