import Link from "next/link";

import { Globe } from "lucide-react";

import { getCopyright } from "@/config/app-messages.server";
import { getLocale, getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { LOCALE_NAMES } from "@/core/i18n/client";

import { authMessages, authPageMeta } from "../../_components/messages.server";
import { RegisterForm } from "../../_components/register-form";

export const generateMetadata = () => pageMetadata("/auth/v2/register", authPageMeta("registerV2"));

export default async function RegisterV2() {
  const [text, locale] = await Promise.all([getMessages(authMessages), getLocale()]);

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium break-words hyphens-auto">{text.registerV2.title}</h1>
          <p className="text-muted-foreground text-sm">{text.registerV2.subtitle}</p>
        </div>
        <div className="space-y-4">
          <RegisterForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-right text-sm">
          {text.registerV2.haveAccount}{" "}
          <Link prefetch={false} className="text-foreground" href="login">
            {text.actions.login}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-5 flex w-full justify-between gap-4 px-10">
        <div className="min-w-0 text-sm break-words">{await getCopyright()}</div>
        <div className="flex shrink-0 items-center gap-1 text-sm">
          <Globe className="text-muted-foreground size-4" />
          {LOCALE_NAMES[locale]}
        </div>
      </div>
    </>
  );
}
