import { MailApp } from "@/app/(main)/dashboard/mail/_components/mail-app";
import { mailMessages } from "@/app/(main)/dashboard/mail/_components/messages.server";
import { pageMetadata } from "@/config/metadata.server";

export const generateMetadata = () => pageMetadata("/mail", mailMessages);

export default function Page() {
  return (
    <div className="relative h-dvh min-h-0 overflow-hidden">
      <MailApp />
    </div>
  );
}
