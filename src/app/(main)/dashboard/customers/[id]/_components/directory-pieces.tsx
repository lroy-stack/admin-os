"use client";

import { ContactLinks, CustomerTags } from "../../_components/customer-card";
import type { CustomerRow } from "../../_components/directory-model";

/**
 * The directory's contact links and pills read its dictionary with a hook, so a Server Component reaches them through
 * these two client wrappers. The page provides the directory bundle.
 */
export function RecordTags({ customer }: { customer: CustomerRow }) {
  return <CustomerTags customer={customer} />;
}

export function RecordContactLinks({ customer }: { customer: CustomerRow }) {
  return <ContactLinks customer={customer} />;
}
