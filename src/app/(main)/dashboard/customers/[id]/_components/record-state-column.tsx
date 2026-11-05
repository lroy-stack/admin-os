import { Badge } from "@/components/ui/badge";

import type { CustomerDirectoryMessages } from "../../_components/messages";
import type { CustomerRecordMessages } from "./messages";

interface RecordStateColumnProps {
  blocked: boolean;
  vip: boolean;
  text: CustomerRecordMessages["state"];
  words: CustomerDirectoryMessages["card"];
}

/**
 * Where the customer stands, as the directory's pills say it. The reason for a block is in the header, and consent is
 * a preference, in the overview.
 */
export function RecordStateColumn({ blocked, vip, text, words }: RecordStateColumnProps) {
  return (
    <section aria-labelledby="record-state" className="flex flex-col gap-4">
      <h2 id="record-state" className="text-sm font-medium">
        {text.title}
      </h2>
      <div className="flex flex-wrap items-center gap-1.5">
        {blocked ? (
          <Badge variant="destructive">{words.blocked}</Badge>
        ) : (
          <Badge variant="secondary">{text.active}</Badge>
        )}
        {vip && <Badge className="bg-brand text-brand-foreground text-[11px]">{words.vip}</Badge>}
      </div>
    </section>
  );
}
