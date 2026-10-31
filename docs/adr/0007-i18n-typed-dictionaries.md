# ADR 0007 — i18n: four complete locales in typed dictionaries, `Intl` for formatting, and the locale as a preference cookie

Status: accepted (owner, 2026-10-31) · Date: 2026-10-31 · Spec: `docs/specs/002-reference-console/spec.md` (D3) · Related: ADR 0003–0006

> **Amended 2026-10-31 (T6a):**
>
> - The language switch lives in Preferences, directly under Theme and Font, not in the account menu. The cookie is
>   named `locale`, like the other preference cookies (`theme_mode`, `font`), instead of `studio_locale`.
> - `getLocale()` lives in `src/config/locale.server.ts` because the default comes from config. The Server Action
>   `setLocale` sits with the other preference actions and takes `unknown`, since it is a public endpoint.
> - The Server Action does not call `refresh()`: the Next 16 docs say that setting a cookie in a Server Action
>   already re-renders the current page and its layouts, so client state survives without it.
> - Client components read messages through `useMessages(key)`, where the key is a typed handle
>   (`messageKey<T>(namespace)`) so the dictionary itself stays in a server entry.
> - Client components import `@/core/i18n/client`, never the barrel: the barrel carries every locale's
>   `defaultErrorMessages` and the zod schemas. A dependency-cruiser rule enforces it for every `.tsx` file.
> - Shell chrome strings are `ShellMessages` in `src/ds/shell`. Route titles belong to the app: `NavMessages` in
>   `src/navigation/shell`, keyed by the stable ids of the nav registry (never by index), so the T6b manifest keeps them.
>   **T6b:** `src/navigation` is gone. The showcase titles are `ExamplesMessages` (namespace `examples`) next to
>   `examplesNav`, still keyed by stable ids. The preset's own entries resolve `labelKey` on the server with the
>   preset vocabulary (`textFor` in `src/config/vocabulary.server.ts`) and the client receives plain strings.
> - The dashboard layout renders `lang={locale}` on its wrapper, so the language is right from the first byte even when
>   `Accept-Language` decided it; `<html lang>` is set by the boot script and restored when the provider unmounts.

> **Amended 2026-10-31 (T6c, whole app in four languages, spec 001 D5):**
>
> **Route dictionaries.**
>
> - Every screen owns a dictionary in its route folder as a pair: `_components/messages.ts` (the interface, `messageKey`,
>   no text, safe for client components) and `_components/messages.server.ts` (`en/es/de/fr`, `defineMessages`,
>   `MessageBundle`). Page metadata is part of it: each dictionary has `meta: { title, description }`
>   (`PageMeta` from `@/core/i18n/client`).
> - Server components read it directly: `const text = await getMessages(messages)` (`src/config/locale.server.ts`), or
>   `messages[await getLocale()]`. Client components read it with `useMessages(key)`. Both get the same text.
> - A dictionary reaches client components through `LocaleBundles`. A nested `LocaleProvider` **adds** its messages to
>   the outer one's, so the dashboard layout provides the shell, navigation, `common` (`src/components`) and
>   `dashboard` (shared dashboard pieces) bundles once, and each page adds its own.
> - Shared pieces that print text keep their strings in a shared dictionary: `src/components/common-messages*` for
>   `src/components` (add a key only when two screens need it) and `dashboard/_components/messages*` for the pieces
>   shared by dashboard screens (deal card, standalone button, pipeline stage names).
> - A shared component that needs messages or the locale is a client component. A constant such as `stageTones`
>   lives in a plain `.ts` file, because a client module's non-component exports are references on the server.
>
> **Locale roots.**
>
> - `src/app/_components/locale-root.tsx` has two server components. `LocaleRoot` resolves the locale and currency,
>   renders `LocaleProvider` with the given bundles, and wraps the subtree in an element with `lang` (and an optional
>   `className`). `LocaleBundles` is the same without the element, for a page inside a layout that already has a root.
> - Every route group outside the dashboard has a `layout.tsx` that renders `<LocaleRoot>`: `(main)/auth`,
>   `(main)/chat`, `(main)/mail`, `(main)/unauthorized`, `(external)`, and `not-found.tsx`. The dashboard layout uses
>   `LocaleRoot` with the shell bundles. A group appends its bundles to its own layout.
> - The root layout stays static. It keeps the default-locale title as a fallback, and `<html lang>` still comes from
>   the boot script. Reading cookies in a layout makes the routes below it dynamic; the landing page (`/`) is now
>   dynamic for that reason, until it adopts `[lang]` as this ADR already allows.
>
> **Metadata.** `pageMetadata(path, dictionary, extra?)` in `src/config/metadata.server.ts` returns title,
> description, canonical URL and the Open Graph pair, with `og:locale` from `OG_LOCALES` (`en_US`, `es_ES`, `de_DE`,
> `fr_FR`). A page exports `generateMetadata = () => pageMetadata("/dashboard/default", overviewMessages)`. The app
> meta and the footer line moved out of `APP_CONFIG` into `src/config/app-messages.server.ts`.
>
> **Formats.** Everything user-visible goes through `@/core/i18n/client` (from `format.ts` and `chart-format.ts`):
> `formatAmount` (major units, `compact` or `fractionDigits`), `formatCurrency` (minor units), `formatCompact`,
> `formatPercent` (`signed`), `formatCalendarDate` (an ISO day, formatted in UTC so it never shifts), `formatLocalDate`
> (a `Date` that a browser widget built in the device zone), `formatDate`/`formatTime` (business zone), `monthNames`,
> `weekdayNames`, `weekdayNamesFromWeekStart`, `weekStart`, `currencyOptions`, `currencySymbol`, and for recharts
> `chartFormatters(locale, currency)` or `useChartFormatters()`. No `toLocaleString`, no `Intl` constructor with a literal
> locale, no `$` literal, no hand-written month or weekday arrays, no `format()` from date-fns for visible dates.
> The old `formatCurrency` in `src/lib/utils.ts` and `formatShortDate`, `formatMonth`, `formatTimeAgo` and `stageLabels` in
> `src/lib/crm.ts` (hard-coded `en-US`, USD, English) stay only for screens not yet converted; whoever converts the last
> caller deletes them, and T6e checks they are gone.
> Widget locale packs live in a separate entry, `@/core/i18n/ui` (`dateFnsLocale` for `react-day-picker` and date-fns
> options, `fullCalendarLocale` for FullCalendar), because the four date-fns packs and three FullCalendar packs are
> about 30 KB; import them only where such a widget is mounted. The FullCalendar `locale` goes through the props that
> `EventCalendarViews` already forwards (`{...restOptions}`), so `src/components/calendar` is untouched.
>
> **Demo content.** Business text in demo data (deal titles, event titles, line-item descriptions, email and chat
> bodies, notes) is localized on the server before it reaches a client component. Two shapes, both complete by type:
> a key-per-locale entry in the route dictionary (the calendar's `demoEvents`, the invoice's `demoItems`), or a
> translation table next to shared data (`src/data/crm-text.ts`: `localizeDeals`, which throws for an untranslated
> title, with a test that every deal is covered). People, companies, emails, addresses, brands and model codes stay as
> they are. Content built from dates (`new Date()`) is built where the time zone is right: calendar events in the client,
> the invoice's day on the server.
>
> **Currency.** The currency is a business setting, independent of the language: the locale decides how an amount is
> written, never which currency it is in.
>
> - `CURRENCIES = ["USD", "EUR", "GBP"]` and `isCurrency` are in `src/core/money` (client entry `@/core/money/client`,
>   without zod). A `Money` value carries its own currency and is formatted with it.
> - Resolution mirrors the locale: the `currency` cookie, then the region of the first `Accept-Language` tag whose
>   region has an offered currency (es-ES, de-DE, fr-FR and the other euro-area regions give EUR, en-GB gives GBP, en-US
>   gives USD; a tag without a region says nothing), then `APP_CONFIG.i18n.defaultCurrency` (USD). `resolveCurrency` is
>   pure and tested; `getCurrency()` sits next to `getLocale()`.
> - Preferences has a Currency select directly under Language. `setCurrency(unknown)` validates, writes the cookie with
>   the `locale` cookie's attributes, and the picker toasts a translated error like `setLocale`. "Restore defaults"
>   leaves both alone.
> - `LocaleProvider` carries the currency: `useCurrency()`, `useChartFormatters()`. Plain numbers in demo data are the
>   business's books **in the selected currency**; nothing converts and there are no exchange rates. A real adapter
>   supplies the currency per amount. On the invoice the currency is a property of the document: it starts as the
>   business currency and the form offers the three.
>
> **Enforcement.**
>
> - One Biome override in `biome.json` lists the finished folders and turns on two checks for them: `style/noJsxLiterals`
>   for text between tags, and the GritQL plugin `lint/no-visible-string-props.grit` for string literals in visible
>   props (`aria-label`, `placeholder`, `title`, `alt`, `label`, `description`, `tooltip`, and any prop ending in
>   `Label`, `Text`, `Title`, `Description` or `Placeholder`). The plugin lists visible props by name because Biome's
>   `noStrings` option cannot tell `aria-label` from `className`, and its `allowedStrings` is global. Punctuation and
>   symbols alone (":", "%", "/") are allowed by `noJsxLiterals`. A string built in an expression
>   (`` {`${name} (${rate})`} ``) is not flagged, so build text from dictionary templates, not from literals.
> - **To finish a folder**, append it to the override's `includes` array in the same change that moves its last string
>   into a dictionary. One line per route or folder, kept in group order. T6e widens the list to all of `src/app` and
>   `src/components` except `ui/` and `calendar/`.
> - `assertDictionaryParity` also rejects, in `fr`, a plain space before `: ; ? !` and a straight apostrophe.
>
> **Glossary.** `docs/i18n/glossary.md` is the vocabulary and the register (es tú, de du, fr vous). One term per
> concept; a new term is a new row in the same commit.
>
> ### How to translate a screen
>
> 1. **Inventory.** List every visible string in the route: JSX text, `aria-label`, `placeholder`, `title`, `alt`,
>    chart legends and axes, tooltips, toasts, validation messages, `generateMetadata`/`metadata`, enum and status
>    labels, and demo content. Grep for `toLocale`, `Intl.`, `"en-US"`, `"en-GB"`, `format(` from date-fns, `$`, and
>    hand-written month or weekday arrays.
> 2. **Glossary first.** Reuse the glossary's terms. Add any missing concept as a row.
> 3. **Dictionary.** Create `messages.ts` (interface, `meta`, plurals as `Plural`, `{placeholders}` for values, a key per
>    demo text) and `messages.server.ts` (`en`, `es`, `de`, `fr`, `defineMessages`, a `MessageBundle`). Never put a
>    number, date, percentage or currency symbol in a string; put `{placeholders}` and format the value.
> 4. **Test.** Add `messages.test.ts` with `assertDictionaryParity(messages, allowIdentical)`. The allow-list holds only
>    real proper nouns, abbreviations and punctuation-only joins, each with a comment. Run it before writing the UI.
> 5. **Page.** `export const generateMetadata = () => pageMetadata(path, messages)`. In the page, get the locale and
>    currency, wrap the content in `<LocaleBundles bundles={[bundle]}>`, and localize demo data on the server.
> 6. **Components.** Server components: `await getMessages(messages)`, `getLocale()`, `getCurrency()`. Client components:
>    `useMessages(key)`, `useLocale()`, `useCurrency()`, `useChartFormatters()`, all from `@/core/i18n/client` (never the
>    barrel). Build strings with `format(template, locale, params)`; pick plurals with a `Plural`.
> 7. **Formats.** Replace every number, date, currency and name list with the helpers above. FullCalendar gets
>    `locale={fullCalendarLocale(locale)}`; the shadcn `Calendar` gets `locale={dateFnsLocale(locale)}`.
> 8. **Validation.** A zod schema is built from the dictionary's `validation` messages (see `createInvoiceSchema`), so the
>    client resolver and any server that parses the same data report the same sentence.
> 9. **Gate.** Append the folder to the Biome override, then run `npm run check`, `npx tsc --noEmit`, `npm test` and
>    `npm run build`. Check the screen in all four languages and, if it shows money, in all three currencies.
> 10. **Do not** touch `src/components/ui` or `src/components/calendar`, edit the dictionary of a screen you do not
>     own, or leave an English literal "for now".

## Context

**The owner's requirement.** The kit ships in **English, Spanish, German and French** (`en`, `es`, `de`, `fr`), with
every string translated: no partial dictionaries.

**This repo today:**

- About 25 screens with hard-coded English. For example `bookings/_components/reservations.tsx` has
  `{ value: "floor", label: "Floor" }`, and `shell/app-rail.tsx` has `aria-label="Quick access"`.
- The root layout is static with `lang="en"` (`src/app/layout.tsx`). `ThemeBootScript` applies preferences from
  cookies and localStorage before paint, so that the root layout can stay static (`src/scripts/theme-boot.tsx`).
- Currency and dates are not localised:
  - `formatCurrency` defaults to USD / `en-US` (`src/lib/utils.ts:27-28`);
  - user-visible dates are formatted with `date-fns` `format()` (`finance/page.tsx`, `calendar/_components/*`,
    `mail/_components/*`).

**What reference does:**

- Staff locales are es / en / de. Texts live in `src/i18n/*.ts` as `Record<StaffLocale, Textos…>`, read through an
  accessor (`apps/console/src/i18n/navegacion.ts`).
- The locale is a **server-stored preference copied to a cookie**. One resolver applies "cookie >
  `Accept-Language` > Spanish" (`resolveStaffLocale`, `packages/site-shell/src/lang.ts`). Staff deliberately ignore
  `?lang=`: "staff change language with their preference, not with a link".
- Errors are rendered from codes only (`textoDelError`, `apps/console/src/i18n/errores.ts`).

**The bundled Next 16 guide** (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`):

- It recommends an `app/[lang]` segment with server-only dictionaries, `hasLocale` plus `notFound()`,
  `next/root-params` `lang()`, and `proxy.ts` for `Accept-Language` redirects.
- It notes that root-param getters do not run in Server Actions or Route Handlers.
- It does not cover a cookie-only locale.

**Spec D3** asked for Spanish as the default.

**Plural rules differ by locale.** Checked in Node 24 with `Intl.PluralRules`:

- `fr` selects `one` for **0**;
- `es` and `fr` select `many` for 1 000 000;
- `en` and `de` have only `one` and `other`.

A hand-made `n === 1` is therefore wrong in French.

## Options considered

**How dictionaries are stored:**

1. **next-intl.**
   - *Pros:* ICU messages, routing helpers, RSC support.
   - *Cons:*
     - a new dependency with its own plugin and request config;
     - JSON messages need declaration merging to be typed;
     - preset vocabulary overrides still need custom merging;
     - reference's dictionaries do not use it, so the port is not mechanical.
   - *Effort / reversal:* M / M.
2. **JSON dictionaries per locale, as in the Next guide.**
   - *Cons:* no compile-time completeness without codegen, and placeholders are untyped.
   - *Effort / reversal:* S / S.
3. **Typed TypeScript dictionaries, data-only, with `Intl` for formatting (chosen).** This is reference's
   `Record<Locale, T>` pattern.
   - *Effort / reversal:* S–M / S.

**How the locale is resolved:**

1. **An `app/[lang]` URL segment.**
   - *Pros:* the documented pattern; locale-static pages; SEO.
   - *Cons:*
     - every dashboard route moves under `[lang]`, and every `href` and `isActiveLink` changes;
     - shared links carry the sender's language;
     - the static-rendering benefit disappears anyway, because the dashboard reads the session per request
       (ADR 0005, 0006).
2. **A preference cookie (chosen).**
   - *How:* resolved on the server in `getRuntime()`; the language switch lives in the account menu.

## Decision

Options 3 and 2.

### Locales and the default

- **The kit's locales are `LOCALES = ["en", "es", "de", "fr"] as const`** in `src/core/i18n`. Adding a locale is a
  type change, so the compiler then lists every missing dictionary.
- **The default locale is `en`** for the published template, set in `src/config/app-config.ts`
  (`i18n.defaultLocale`).

**Why English:**

- the default only applies when neither the cookie nor `Accept-Language` matches, so Spanish, German and French
  browsers still get their language;
- English is the widest fallback for every other language;
- the template's audience and its existing screens are English, so untranslated screens stay coherent with the
  chrome during the migration.

**Approval and the reference port:**

- This amends spec D3 and needs the owner's acceptance.
- reference's console sets `es` in its own config when ported.

### Resolution

Order: the `locale` cookie (when supported), then `Accept-Language` (q-ordered, matched on the base
language), then `defaultLocale`.

- **The resolver** is a pure `resolveLocale({cookie, acceptLanguage, defaultLocale})`, ported from reference's
  `idiomaDelPersonalDe`. `getLocale()` (server, `React.cache`) feeds it with `cookies()` and `headers()`.
- **The switch** is a Server Action that writes the cookie (Next then re-renders the page). With a real backend, the adapter
  also stores the preference (reference's `core.identity.locale.set_self`).
- **No `[lang]` segment and no `proxy.ts`.**
  - `cookies()` also works in Server Actions, unlike root params.
  - A public, SEO-relevant surface such as the `(external)` landing may adopt `[lang]` later, on its own.
- **`<html lang>` without making the root layout dynamic.** `ThemeBootScript` already runs before paint, so it
  also sets `document.documentElement.lang` from the cookie. The root layout stays static, which follows that
  file's own rationale.

### Messages are data and complete by type

**Module dictionaries.** Each module, engine and ds area exports its dictionary from its server entry (ADR 0003):

```ts
export interface BookingsMessages {
  readonly title: string;
  readonly partySize: string;
  readonly count: Plural;                 // { one, other, zero?, two?, few?, many? } — selected by Intl.PluralRules
  readonly lateBy: string;                // placeholders: "{minutes}"
  readonly errors: Readonly<Record<string, string>>; // per error code (see below)
}
export const bookingsMessages = defineMessages<BookingsMessages>({ en, es, de, fr }); // Record<Locale, BookingsMessages>
```

**Completeness is enforced twice:**

- **At compile time.** `Record<Locale, T>` fails when a locale is missing, and each locale constant typed `T` fails
  when a key is missing.
- **By a vitest parity test** over every dictionary and every preset vocabulary (ADR 0008):
  - no empty strings;
  - an identical set of `{placeholders}` across locales;
  - every `Plural` has `one` and `other`;
  - no key equal across all four locales unless allow-listed (brand names). `assertDictionaryParity` takes the allow-list as its second argument.

**Only data, never functions.** Messages hold strings, `{placeholder}` templates and `Plural` objects. They are
therefore serialisable: the server resolves them for **one** locale and passes them to the client, and the other
three locales never reach the browser.

**Preset vocabulary is key-major**, so it is complete per key by construction:

```ts
// src/verticals/hospitality/server.ts
vocabulary: {
  "bookings.title":     { en: "Reservations", es: "Reservas",   de: "Reservierungen", fr: "Réservations" },
  "bookings.partySize": { en: "Covers",       es: "Comensales", de: "Gedecke",        fr: "Couverts" },
  "resources.kind":     { en: "Table",        es: "Mesa",       de: "Tisch",          fr: "Table" },
}
```

- **Keys are paths into module messages.**
  > **Amended 2026-10-31 (T4):** the paths are checked by the contract test (`src/config/contracts.test.ts`: the key
  > exists, and its shape and placeholders match the module message), not by the compiler.
- **Presets override whole messages, never nouns inside a sentence.** Interpolating a noun breaks grammatical
  gender: "Nueva reserva", "Nueva cita", "Nuevo pedido".
- **The server merges** module defaults with preset overrides once per locale and preset, cached.

**Client access.**

- `<LocaleProvider locale messages>` sits in the dashboard layout. Code calls `useMessages("bookings")` and
  `useFormat()`.
- Server Components call `getMessages("bookings")`.
- `t(template, values)` fills placeholders, and `plural(locale, n, message)` selects the form.

### Formatting goes through `Intl` only

**`src/core/i18n/format`** builds memoised formatters for the active locale:

- `Intl.NumberFormat` for numbers and percentages;
- `Intl.NumberFormat` with `style: "currency"`, using the **currency from the business settings** (the preset seed
  or the backend), never the locale;
- `Intl.DateTimeFormat` with the **business time zone** from the clock capability (ADR 0005), never the device;
- `Intl.RelativeTimeFormat` with `numeric: "auto"` ("yesterday", "gestern", "hier");
- `Intl.ListFormat`;
- `Intl.PluralRules`.

**Rules:**

- `date-fns` stays for date arithmetic only. User-visible `format()` calls are replaced when their slice touches
  them.
- `formatCurrency` in `src/lib/utils.ts` is replaced by `useFormat().currency(amount)`, so the USD default goes
  away.
- FullCalendar gets the same `locale` and `timeZone` through the agenda engine. Its own locale packs cover its
  chrome; verify the FullCalendar 7 import path when the engine lands.

### Errors are rendered from codes

`errorText(error, messages)` is a port of `textoDelError`. Lookup order:

1. `code|rule`;
2. `code` (the module's `errors`);
3. the class of the code's suffix (`not_found`, `forbidden`, `invalid`, `required`, `conflict`, `unavailable`,
   `timeout`), in core's dictionary;
4. a generic sentence that shows the code.

The server's `message` is never rendered. Rule violations compose their sentence from
`details.violations[{ruleId, params}]` in the owning module.

### No hard-coded text in package-shaped layers

- **Biome `style/noJsxLiterals`** (text children) is enabled on `src/ds`, `src/engines`, `src/modules` and
  `src/verticals` (ADR 0003).
- **Attribute strings** (`aria-label`, `placeholder`, `title`) are checked in review until Biome can scope its
  `noStrings` option to them. Today that option would also flag `className`.
- **Existing screens keep working.** English screens stay as they are; they move to dictionaries when their slice
  touches them (D3). Routes under `(examples)` stay English-only as template demos.

## Consequences

- **Content needs translators.** Every new string is written in four languages in the same change.
  Machine-translated drafts are acceptable only if a native speaker reviews them before the slice ships. That
  goes in the slice's acceptance list.
- **The dashboard layout reads the locale cookie,** which it already does for the session.
- **Business data in seeds is not translated:** guest notes, dish names in the seed. It is content, like real data.
  Catalogue names use i18n fields (`{source, translations}`, reference `packages/contracts/src/i18n.ts`) when the
  catalog module lands.
- **The port is close to mechanical.** It means renaming the cookie (`reference_staff_lang`) and adding `fr` on
  reference's side, which its types will then demand.
- **Revisit when:**
  - translators need external tooling (TMS, ICU files), or a locale needs ICU features beyond plural selection.
    Then generate these typed dictionaries from ICU JSON, or adopt next-intl;
  - a public, SEO-indexed surface joins the kit. That surface takes a `[lang]` segment of its own.
