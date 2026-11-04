import Link from "next/link";

import { Command } from "lucide-react";

import { getMessages } from "@/config/locale.server";
import { pageMetadata } from "@/config/metadata.server";

import { LoginForm } from "../../_components/login-form";
import { authMessages, authPageMeta } from "../../_components/messages.server";

export const generateMetadata = () => pageMetadata("/auth/v1/login", authPageMeta("loginV1"));

export default async function LoginV1() {
  const text = await getMessages(authMessages);

  return (
    <div className="flex h-dvh">
      <div className="bg-primary hidden lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <Command className="text-primary-foreground mx-auto size-12" />
            <div className="space-y-2">
              <h1 className="text-primary-foreground text-5xl font-light break-words hyphens-auto">
                {text.loginV1.panelTitle}
              </h1>
              <p className="text-primary-foreground/80 text-xl">{text.loginV1.panelSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-background flex w-full items-center justify-center p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-10 py-24 lg:py-32">
          <div className="space-y-4 text-center">
            <div className="font-medium tracking-tight">{text.loginV1.title}</div>
            <div className="text-muted-foreground mx-auto max-w-xl">{text.loginV1.description}</div>
          </div>
          <div className="space-y-4">
            <LoginForm />
            <p className="text-muted-foreground text-center text-xs">
              {text.loginV1.noAccount}{" "}
              <Link prefetch={false} href="register" className="text-primary">
                {text.actions.register}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
