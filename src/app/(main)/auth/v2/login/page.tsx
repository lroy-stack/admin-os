import Link from "next/link";

import { Globe } from "lucide-react";

import { getCopyright } from "@/config/app-messages.server";
import { getLocale, getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";
import { LOCALE_NAMES } from "@/core/i18n/client";

import { LoginForm } from "../../_components/login-form";
import { authMessages, authPageMeta } from "../../_components/messages.server";
import { GoogleButton } from "../../_components/social-auth/google-button";

export const generateMetadata = () => pageMetadata("/auth/v2/login", authPageMeta("loginV2"));

export default async function LoginV2() {
  const [text, locale] = await Promise.all([getMessages(authMessages), getLocale()]);

  return (
    <>
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-medium break-words hyphens-auto">{text.loginV2.title}</h1>
          <p className="text-muted-foreground text-sm">{text.loginV2.subtitle}</p>
        </div>
        <div className="space-y-4">
          <GoogleButton className="w-full" />
          <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span className="bg-background text-muted-foreground relative z-10 px-2">
              {text.actions.orContinueWith}
            </span>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="absolute top-5 flex w-full justify-end px-10">
        <div className="text-muted-foreground text-right text-sm">
          {text.loginV2.noAccount}{" "}
          <Link prefetch={false} className="text-foreground" href="register">
            {text.actions.register}
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
