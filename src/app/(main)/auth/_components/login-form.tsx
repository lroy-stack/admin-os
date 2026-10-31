"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { createLoginSchema, PASSWORD_MIN_LENGTH } from "./auth-schema";
import { authMessageKey } from "./messages";

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

function showSubmitted(title: string, data: LoginValues) {
  toast(title, {
    description: (
      <pre className="mt-2 w-[320px] rounded-md bg-neutral-950 p-4">
        <code className="text-white">{JSON.stringify(data, null, 2)}</code>
      </pre>
    ),
  });
}

export function LoginForm() {
  const text = useMessages(authMessageKey);
  const locale = useLocale();
  const schema = useMemo(
    () =>
      createLoginSchema({
        emailInvalid: text.validation.emailInvalid,
        passwordTooShort: format(text.validation.passwordTooShort, locale, { min: PASSWORD_MIN_LENGTH }),
      }),
    [text, locale],
  );
  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => showSubmitted(text.submitted, data))}
      className="flex flex-col gap-4"
    >
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">{text.fields.email}</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                placeholder={text.fields.emailPlaceholder}
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">{text.fields.password}</FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                placeholder={text.fields.passwordPlaceholder}
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="login-remember" className="font-normal">
                  {text.fields.remember}
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit">
        {text.actions.login}
      </Button>
    </form>
  );
}
