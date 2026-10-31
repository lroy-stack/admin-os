"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  Globe,
  Link,
  Mail,
  MapPin,
  Monitor,
  MoreHorizontal,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMessages } from "@/core/i18n/client";
import { getInitials } from "@/lib/utils";

import type { Contact } from "./data";
import { chatMessageKey } from "./messages";

interface ChatProfileDetailsProps {
  contact: Contact;
  onClose?: () => void;
}

export function ChatProfileDetails({ contact, onClose }: ChatProfileDetailsProps) {
  const text = useMessages(chatMessageKey);
  const { fields } = text.profile;

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
        <Button size="icon-sm" variant="ghost" aria-label={text.profile.email}>
          <Mail className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={text.profile.call}>
          <PhoneCall className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={text.profile.schedule}>
          <Calendar className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={text.profile.copyLink}>
          <Link className="size-3.5" />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={text.profile.more}>
          <MoreHorizontal className="size-3.5" />
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList variant="line" className="w-full justify-between border-b px-0 **:data-[slot=tabs-trigger]:flex-1">
          <TabsTrigger value="details">{text.profile.tabs.details}</TabsTrigger>
          <TabsTrigger value="files">{text.profile.tabs.files}</TabsTrigger>
          <TabsTrigger value="activity">{text.profile.tabs.activity}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.email}</span>
            <span className="ml-auto truncate text-sm">{contact.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.phone}</span>
            <span className="ml-auto truncate text-sm">{contact.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.website}</span>
            <span className="ml-auto truncate text-sm">{contact.website}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.company}</span>
            <span className="ml-auto truncate text-sm">{contact.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserRound className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.role}</span>
            <span className="ml-auto min-w-0 text-right text-sm break-words hyphens-auto">{contact.role}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.stage}</span>
            <Badge variant="secondary" className="ml-auto">
              {contact.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.qualifiedSince}</span>
            <span className="ml-auto truncate text-sm">{contact.qualifiedAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.timezone}</span>
            <span className="ml-auto truncate text-sm">{contact.timezone}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.location}</span>
            <span className="ml-auto truncate text-sm">{contact.location}</span>
          </div>
          <div className="flex items-start gap-2">
            <Tag className="text-muted-foreground size-4 shrink-0" />
            <span className="text-muted-foreground shrink-0 text-sm">{fields.tags}</span>
            <div className="ml-auto flex flex-wrap justify-end gap-1">
              {contact.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
