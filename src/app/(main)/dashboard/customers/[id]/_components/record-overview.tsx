import type { Locale } from "@/core/i18n/client";
import { StatTiles } from "@/ds/components";

import { type CustomerRow, lastVisitText, spendText } from "../../_components/directory-model";
import type { CustomerDirectoryMessages } from "../../_components/messages";
import { FactList } from "./fact-list";
import type { CustomerRecordMessages } from "./messages";
import type { ConsentState } from "./record-model";

interface RecordOverviewProps {
  customer: CustomerRow;
  noShows: number;
  /** The language's name in the page's language; null when the customer gave none. */
  language: string | null;
  consent: ConsentState;
  text: CustomerRecordMessages;
  words: CustomerDirectoryMessages["card"];
  locale: Locale;
}

function consentText(consent: ConsentState, common: CustomerRecordMessages["common"]): string {
  if (consent === "granted") return common.yes;
  return consent === "declined" ? common.no : common.notGiven;
}

/** The customer's figures, then what they asked for. */
export function RecordOverview({ customer, noShows, language, consent, text, words, locale }: RecordOverviewProps) {
  return (
    <div className="flex flex-col gap-6">
      <StatTiles
        className="sm:grid-cols-4"
        items={[
          { label: words.visits, value: customer.visits },
          { label: words.spend, value: spendText(customer, locale) },
          { label: words.lastVisit, value: lastVisitText(customer, locale, words.never) },
          { label: text.overview.noShows, value: noShows },
        ]}
      />

      <section aria-labelledby="record-preferences" className="flex flex-col gap-3">
        <h2 id="record-preferences" className="text-sm font-medium">
          {text.overview.preferences}
        </h2>
        <FactList
          className="sm:grid-cols-2"
          facts={[
            { label: text.overview.marketing, value: consentText(consent, text.common) },
            {
              label: text.overview.language,
              value: language ?? text.common.notGiven,
            },
          ]}
        />
      </section>
    </div>
  );
}
