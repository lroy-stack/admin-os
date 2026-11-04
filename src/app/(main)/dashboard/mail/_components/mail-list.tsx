import { cn } from "cn";
import { differenceInDays } from "date-fns/differenceInDays";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatLocalDate, formatRelative, type Locale, useLocale, useMessages } from "@/core/i18n/client";

import { accounts, type Mail } from "./data";
import { useMailbox } from "./mail-context";
import { updateMail } from "./mail-session";
import { selectMail } from "./mail-state";
import { mailMessageKey } from "./messages";

type MailGroup = {
  id: string;
  title: string;
  items: Mail[];
};

interface MailListProps {
  groups: MailGroup[];
  onSelectMail?: (mail: Mail) => void;
}

export function MailList({ groups, onSelectMail }: MailListProps) {
  const { state } = useMailbox();
  const text = useMessages(mailMessageKey);
  const locale = useLocale();

  return (
    <ScrollArea className="**:data-[slot=scroll-area-viewport]:scroll-fade min-h-0 flex-1">
      <div className="flex flex-col gap-1.5 pt-0">
        {groups.map((group) => (
          <section key={group.id} className="flex flex-col gap-1.5">
            <div className="text-muted-foreground mx-3 text-xs">
              {format(text.inbox.groupTitle, locale, { title: group.title, count: group.items.length })}
            </div>

            <div className="flex flex-col">
              {group.items.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  data-mail-id={item.id}
                  className={cn(
                    "group relative w-full border-y border-transparent p-3 text-left transition-colors",
                    "hover:bg-muted/60",
                    state.selected === item.id &&
                      "border-border bg-muted/70 before:bg-primary before:absolute before:-inset-y-px before:left-0 before:w-0.5",
                  )}
                  onClick={(event) => {
                    event.currentTarget.blur();

                    updateMail((current) => selectMail(current, item.id));
                    onSelectMail?.(item);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="size-9 after:rounded-sm">
                      <AvatarFallback className="bg-background rounded-sm">{counterpart(item).name[0]}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div
                            className={cn(
                              "flex items-center gap-2 truncate text-sm font-normal",
                              !item.isRead && "font-medium",
                            )}
                          >
                            {isOwn(item) ? `${text.view.to} ${counterpart(item).name}` : item.from.name}{" "}
                            {!item.isRead && <span className="size-2 rounded-full bg-blue-600" />}
                          </div>
                          <div
                            className={cn(
                              "text-foreground truncate text-xs font-medium",
                              item.isRead && "text-muted-foreground font-normal",
                            )}
                          >
                            {item.subject}
                          </div>
                        </div>

                        <div
                          className={cn(
                            "text-muted-foreground shrink-0 text-xs",
                            state.selected === item.id && "text-foreground",
                          )}
                        >
                          {formatMailDate(item.receivedAt, locale)}
                        </div>
                      </div>

                      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">{item.body}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </ScrollArea>
  );
}

/** Who the list names: the sender, or on a message the person sent, its first recipient. */
function counterpart(mail: Mail) {
  return isOwn(mail) ? (mail.to[0] ?? mail.from) : mail.from;
}

const isOwn = (mail: Mail) => accounts.some((account) => account.email === mail.from.email);

function formatMailDate(date: string, locale: Locale) {
  const mailDate = new Date(date);

  if (differenceInDays(new Date(), mailDate) <= 3) {
    return formatRelative(mailDate, new Date(), locale);
  }

  return formatLocalDate(mailDate, locale, { day: "numeric", month: "short", year: "numeric" });
}
