import { describe, expect, it } from "vitest";

import { createLoginSchema, createRegisterSchema } from "./auth-schema";

const text = {
  emailInvalid: "email-invalid",
  passwordTooShort: "password-short",
  confirmTooShort: "confirm-short",
  passwordsMismatch: "mismatch",
};

const messagesOf = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe("login schema", () => {
  it.each([
    { email: "ana@example.com", password: "secret1", expected: [] },
    { email: "not-an-email", password: "secret1", expected: ["email-invalid"] },
    { email: "ana@example.com", password: "12345", expected: ["password-short"] },
  ])("reports $expected for $email / $password", ({ email, password, expected }) => {
    expect(messagesOf(createLoginSchema(text).safeParse({ email, password }))).toEqual(expected);
  });
});

describe("register schema", () => {
  it.each([
    { password: "secret1", confirmPassword: "secret1", expected: [] },
    { password: "secret1", confirmPassword: "secret2", expected: ["mismatch"] },
    { password: "secret1", confirmPassword: "abc", expected: ["confirm-short", "mismatch"] },
  ])("reports $expected for $password / $confirmPassword", ({ password, confirmPassword, expected }) => {
    const result = createRegisterSchema(text).safeParse({ email: "ana@example.com", password, confirmPassword });
    expect(messagesOf(result)).toEqual(expected);
  });
});
