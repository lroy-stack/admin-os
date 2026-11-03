"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { format, useLocale, useMessages } from "@/core/i18n/client";

import { createRegisterSchema, PASSWORD_MIN_LENGTH } from "./auth-schema";
import { authMessageKey } from "./messages";

type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterForm() {
  const text = useMessages(authMessageKey);
  const locale = useLocale();
  const schema = useMemo(() => {
    const params = { min: PASSWORD_MIN_LENGTH };
    return createRegisterSchema({
      ...text.validation,
      passwordTooShort: format(text.validation.passwordTooShort, locale, params),
      confirmTooShort: format(text.validation.confirmTooShort, locale, params),
    });
  }, [text, locale]);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(() => toast(text.notConnected.register))}
      className="flex flex-col gap-4"
    >
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email">{text.fields.email}</FieldLabel>
              <Input
                {...field}
                id="register-email"
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
              <FieldLabel htmlFor="register-password">{text.fields.password}</FieldLabel>
              <Input
                {...field}
                id="register-password"
                type="password"
                placeholder={text.fields.passwordPlaceholder}
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-confirm-password">{text.fields.confirmPassword}</FieldLabel>
              <Input
                {...field}
                id="register-confirm-password"
                type="password"
                placeholder={text.fields.passwordPlaceholder}
                autoComplete="new-password"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      <Button className="w-full" type="submit">
        {text.actions.register}
      </Button>
    </form>
  );
}
