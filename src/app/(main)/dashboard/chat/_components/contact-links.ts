/** A `tel:` link for a phone number written for people ("+1 (415) 555-0123"); `null` when there is no number. */
export function telHref(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.replace(/\+/g, "") === "" ? null : `tel:${digits}`;
}

/** A `mailto:` link, or `null` when there is no address. */
export function mailtoHref(email: string): string | null {
  return email.trim() === "" ? null : `mailto:${email.trim()}`;
}

/** The address of a contact's website as a link to copy; the data holds it without a scheme ("railway.co"). */
export function websiteUrl(website: string): string | null {
  const host = website.trim();
  if (host === "") return null;
  return /^https?:\/\//i.test(host) ? host : `https://${host}`;
}
