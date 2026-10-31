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
> - The dashboard layout renders `lang={locale}` on its wrapper, so the language is right from the first byte even when
>   `Accept-Language` decided it; `<html lang>` is set by the boot script and restored when the provider unmounts.

## Context

**The owner's requirement.** The kit ships in **English, Spanish, German and French** (`en`, `es`, `de`, `fr`), with
every string translated: no partial dictionaries.

**This repo today:**

- About 25 screens with hard-coded English. For example `reservas/_components/reservations.tsx` has
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
