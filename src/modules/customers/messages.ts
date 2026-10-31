import { defineMessages, type Plural } from "@/core/i18n";

export interface CustomersMessages {
  readonly title: string;
  readonly count: Plural;
}

export const customersMessages = defineMessages<CustomersMessages>({
  en: { title: "Customers", count: { one: "{count} customer", other: "{count} customers" } },
  es: { title: "Clientes", count: { one: "{count} cliente", other: "{count} clientes" } },
  de: { title: "Kunden", count: { one: "{count} Kunde", other: "{count} Kunden" } },
  fr: { title: "Clients", count: { one: "{count} client", other: "{count} clients" } },
});
