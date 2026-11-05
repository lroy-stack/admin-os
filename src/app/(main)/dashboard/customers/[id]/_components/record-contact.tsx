import { FactList } from "./fact-list";
import type { CustomerRecordMessages } from "./messages";
import type { ContactDetails } from "./record-model";

/** Name, email, phone and language, read-only; what the customer never gave shows as "Not given". */
export function RecordContact({ contact, text }: { contact: ContactDetails; text: CustomerRecordMessages }) {
  const orNotGiven = (value: string | null) => value ?? text.common.notGiven;
  return (
    <FactList
      className="sm:grid-cols-2"
      facts={[
        { label: text.contact.name, value: contact.name },
        { label: text.contact.email, value: orNotGiven(contact.email) },
        { label: text.contact.phone, value: orNotGiven(contact.phone) },
        { label: text.contact.language, value: orNotGiven(contact.language) },
      ]}
    />
  );
}
