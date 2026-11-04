import { LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getLocale, getMessages } from "@/config/locale.server";

import { profileMessages } from "./messages.server";
import type { ProfileDocument } from "./profile-data";

export async function ProfileDocuments({ documents }: { documents: ProfileDocument[] }) {
  const [text, _locale] = await Promise.all([getMessages(profileMessages), getLocale()]);
  const labels = text.documents;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading min-w-0 text-base font-medium">{labels.title}</h2>
      </div>

      <Table className="border-y">
        <TableCaption className="sr-only">{labels.caption}</TableCaption>
        <TableHeader className="[&_th]:h-8">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-2/5">
              <span className="sr-only">{labels.document}</span>
            </TableHead>
            <TableHead>{labels.category}</TableHead>
            <TableHead>{labels.updated}</TableHead>
            <TableHead>{labels.status}</TableHead>
            <TableHead className="text-right">{labels.access}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id}>
              <TableCell className="font-medium break-words hyphens-auto whitespace-normal">{document.name}</TableCell>
              <TableCell className="text-muted-foreground break-words hyphens-auto whitespace-normal">
                {document.category}
              </TableCell>
              <TableCell className="text-muted-foreground">{document.updatedAt}</TableCell>
              <TableCell>
                <Badge className="rounded-sm" variant="outline">
                  {labels.statuses[document.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {document.isRestricted ? (
                  <span
                    className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
                    title={labels.restricted}
                  >
                    <LockKeyhole aria-hidden="true" className="size-3.5" />
                    {labels.restricted}
                  </span>
                ) : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
