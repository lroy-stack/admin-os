"use client";

import { useCallback } from "react";

import { toast } from "sonner";

import { format, useLocale, useMessages } from "@/core/i18n/client";

import { feedbackMessageKey } from "./messages";

interface CopyEnvironment {
  readonly clipboard: Pick<Clipboard, "writeText"> | undefined;
  readonly legacyCopy: (text: string) => boolean;
}

/**
 * `execCommand("copy")` through a hidden textarea: the path for browsers or contexts without the Clipboard API.
 * The field goes inside the open dialog when there is one (a dialog's focus trap would pull focus out of a field in
 * `body`), and focus returns to the element that had it. True only when the field really took focus and the copy ran.
 */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined") return false;
  const previous = document.activeElement;
  const host = previous?.closest("[role=dialog],[role=alertdialog]") ?? document.body;
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  host.append(field);
  try {
    field.focus({ preventScroll: true });
    field.setSelectionRange(0, text.length);
    return document.activeElement === field && document.execCommand("copy");
  } catch {
    return false;
  } finally {
    field.remove();
    if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
  }
}

const browserEnvironment = (): CopyEnvironment => ({ clipboard: globalThis.navigator?.clipboard, legacyCopy });

/** Resolves true when the text reached the clipboard: the Clipboard API first, the legacy path if it is missing or refused. */
export async function copyText(text: string, environment: CopyEnvironment = browserEnvironment()): Promise<boolean> {
  if (environment.clipboard) {
    try {
      await environment.clipboard.writeText(text);
      return true;
    } catch {
      // Refused (permissions, insecure context, no focus): try the legacy path.
    }
  }
  return environment.legacyCopy(text);
}

/** Returns `copy(text, label?)`: copies and confirms with a toast, or says it failed. */
export function useCopy(): (text: string, label?: string) => Promise<boolean> {
  const locale = useLocale();
  const { copy: text } = useMessages(feedbackMessageKey);

  return useCallback(
    async (value, label) => {
      const copied = await copyText(value);
      if (copied) {
        toast.success(label === undefined ? text.copied : format(text.copiedLabel, locale, { label }));
      } else {
        toast.error(text.failed);
      }
      return copied;
    },
    [locale, text],
  );
}
