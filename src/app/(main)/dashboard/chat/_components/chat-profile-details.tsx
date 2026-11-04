"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  Globe,
  Link,
  type LucideIcon,
  Mail,
  MapPin,
  Monitor,
  Phone,
  PhoneCall,
  Tag,
  UserRound,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMessages } from "@/core/i18n/client";
import { useCopy } from "@/ds/feedback";
import { getInitials } from "@/lib/utils";

import { mailtoHref, telHref, websiteUrl } from "./contact-links";
import type { Conversation } from "./data";
import { chatMessageKey } from "./messages";

interface ChatProfileDetailsProps {
  conversation: Conversation;
  onClose?: () => void;
}

export function ChatProfileDetails({ conversation, onClose }: ChatProfileDetailsProps) {
  const text = useMessages(chatMessageKey);
  const copy = useCopy();
  const { fields } = text.profile;
  const { contact, tagIds } = conversation;
  const email = mailtoHref(contact.email);
  const phone = telHref(contact.phone);
  const website = websiteUrl(contact.website);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg" className="shrink-0">
          <AvatarFallback className="bg-background">{getInitials(contact.name)}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="truncate leading-5 font-medium">{contact.name}</div>
          <div className="text-muted-foreground truncate text-xs">{contact.role}</div>
        </div>

        <Button variant="ghost" size="icon-sm" aria-label={text.profile.close} onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={text.profile.email}
          disabled={email === null}
          asChild={email !== null}
        >
          {email ? (
            <a href={email}>
              <Mail className="size-3.5" />
            </a>
          ) : (
            <Mail className="size-3.5" />
          )}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={text.profile.call}
          disabled={phone === null}
          asChild={phone !== null}
        >
          {phone ? (
            <a href={phone}>
              <PhoneCall className="size-3.5" />
            </a>
          ) : (
            <PhoneCall className="size-3.5" />
          )}
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={text.profile.copyLink}
          disabled={website === null}
          onClick={() => website && void copy(website, fields.website)}
        >
          <Link className="size-3.5" />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-sm">
          <Detail icon={Mail} label={fields.email} value={contact.email} />
          <Detail icon={Phone} label={fields.phone} value={contact.phone} />
          <Detail icon={Globe} label={fields.website} value={contact.website} />
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <Detail icon={Building2} label={fields.company} value={contact.company} />
          <Detail icon={UserRound} label={fields.role} value={contact.role} wrap />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.stage}</span>
            <Badge variant="secondary" className="ml-auto">
              {contact.status}
            </Badge>
          </div>
          <Detail icon={Calendar} label={fields.qualifiedSince} value={contact.qualifiedAt} />
          <Detail icon={Monitor} label={fields.timezone} value={contact.timezone} />
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <Detail icon={MapPin} label={fields.location} value={contact.location} />
          {tagIds.length > 0 ? (
            <div className="flex items-start gap-2">
              <Tag className="text-muted-foreground size-4 shrink-0" />
              <span className="text-muted-foreground shrink-0 text-sm">{fields.tags}</span>
              <div className="ml-auto flex flex-wrap justify-end gap-1">
                {tagIds.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {text.tags[tag]}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** One line of the contact's details; a contact started in the session has none for most of them, so it is left out. */
function Detail({
  icon: Icon,
  label,
  value,
  wrap = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  wrap?: boolean;
}) {
  if (value === "") return null;
  return (
    <div className="flex items-center gap-2">
      <Icon className="text-muted-foreground size-4 shrink-0" />
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span
        className={wrap ? "ml-auto min-w-0 text-right text-sm break-words hyphens-auto" : "ml-auto truncate text-sm"}
      >
        {value}
      </span>
    </div>
  );
}
