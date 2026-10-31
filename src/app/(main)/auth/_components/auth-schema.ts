import { z } from "zod";

import type { AuthMessages } from "./messages";

export const PASSWORD_MIN_LENGTH = 6;

/** Validation sentences with `{min}` already filled in, so the schema stays free of locale logic. */
export type AuthValidation = AuthMessages["validation"];

export function createLoginSchema(text: Pick<AuthValidation, "emailInvalid" | "passwordTooShort">) {
  return z.object({
    email: z.email(text.emailInvalid),
    password: z.string().min(PASSWORD_MIN_LENGTH, text.passwordTooShort),
    remember: z.boolean().optional(),
  });
}

export function createRegisterSchema(text: AuthValidation) {
  return z
    .object({
      email: z.email(text.emailInvalid),
      password: z.string().min(PASSWORD_MIN_LENGTH, text.passwordTooShort),
      confirmPassword: z.string().min(PASSWORD_MIN_LENGTH, text.confirmTooShort),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: text.passwordsMismatch,
      path: ["confirmPassword"],
    });
}
