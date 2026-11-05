# Building on the template

Each path below names the files to touch, in order, and the decision record behind it. After a change,
`npx tsc --noEmit`, `npm test` and `npm run check` tell you what is still missing; `npm run check:fix` sorts imports.
Read [Architecture](architecture.md) first for the layers and the data seam.

- [Add a module](#add-a-module)
- [Add a preset](#add-a-preset)
- [Add a product view](#add-a-product-view)
- [Configure your business](#configure-your-business)
- [Wire a control](#wire-a-control)
- [Swap the adapter](#swap-the-adapter)
- [Expose a capability to MCP](#expose-a-capability-to-mcp)

## Add a module

Decision records: [ADR 0004](../adr/0004-vertical-presets-and-generic-domains.md),
[0005](../adr/0005-data-seam.md), [0006](../adr/0006-registries-permissions-navigation.md). The smallest complete
example is `src/modules/notifications`.

1. **Schemas.** `src/modules/<domain>/schema.ts` holds the zod schemas for the records, inputs and outputs. Money is
   integer minor units (`moneySchema`), phones are E.164.
2. **Capabilities.** `capabilities.ts` declares one `defineCapability` per operation:
   - an id `<domain>.<verb>` and a `summary` an agent can act on;
   - `input`, `output` and a `permission` such as `read:<domain>`;
   - an `effect` (`read`, `write` or `destructive`) and a `riskTier`;
   - for writes, `change` and `idempotency`.

   Collect them in one `<domain>Capabilities` record; `index.ts` re-exports the capabilities and the schemas.
3. **Mock handlers.** `mock.ts` has a `mockHandler` per capability over the demo data. `server.ts` exports them with
   `messages.ts`, the module's error and label texts in en, es, de and fr.
4. **Manifest and registration** ([ADR 0017](../adr/0017-a-module-is-a-folder.md)).
   - `module.ts` exports `<domain>Module = defineModule({ … })`, and `server.ts` exports `<domain>ModuleServer` with
     its messages and mock handlers.
   - Run `npm run generate:modules`. It writes the composition root in `src/config/*.generated.ts`, and a test fails
     while those files are stale.
   - A capability that takes required input also gives its smallest valid input to `inputFor`
     (`src/config/adapter-contract.testkit.ts`), so the adapter contract can call it.
5. **MCP.** Classify every capability, as [Expose a capability to MCP](#expose-a-capability-to-mcp) says. Until you
   do, the catalogue does not compile.
6. **Turn it on.** Add the module id to the `modules` of each preset that offers it. Roles get its permissions from
   their rule; a module that is off grants nothing.
7. **Tests, at two levels.**
   - In the module (`<domain>.test.ts`), test the schemas and handlers on an inline fixture and run
     `assertDictionaryParity` over its messages. A module sits below the presets and cannot import their seeds.
   - On a preset's seed, test it in `src/config/<domain>.test.ts`, which builds a client with
     `createClient(CATALOG, getAdapter({ vertical, sessionId }), …)`, as `src/config/customers.test.ts` does.

## Add a preset

Decision record: [ADR 0004](../adr/0004-vertical-presets-and-generic-domains.md).

1. Copy `src/verticals/salon`.
   - `index.ts` lists the modules, the nav, the roles, the typed `ext` slots, the setting defaults and the `leakTerms`
     that must never reach the generic layers.
   - `server.ts` and `seed.ts` hold the vocabulary and the demo data.
2. Add it to `VERTICALS` (`src/config/vertical.ts`) and `DEMO` (`src/config/demo-kernel.ts`).

The leak test and the seed tests check it.

## Add a product view

Decision records: [ADR 0018](../adr/0018-product-views-and-inventory.md) §3 and
[ADR 0017](../adr/0017-a-module-is-a-folder.md) §1 and §5. The examples are `catalog.collection` (the menu, the shop,
the parts) and `inventory.stock` and `inventory.orders`.

1. **Declare the kind in the module.** In `module.ts`, add a `defineViewKind` (`src/core/views`) to `views`:
   - its id, `<module>.<view>`;
   - the module;
   - the read capability it calls, whose permission the viewer needs;
   - the schema of its parameters.
2. **Render it.**
   - The module's `ui.ts` exports `<module>ModuleUi`, which maps the kind id to its client component.
   - Its server half gives the kind's loader in `viewLoaders`, which reads through the capability, and the
     component's words in `viewBundles`.
3. **Compose.** Run `npm run generate:modules`. The Products page renders kinds through the generated client map
   and imports no module's views.
4. **List it in a preset.** Add `{ id, kind, labelKey, params }` to the preset's `productViews`, in the order the
   toggle shows.
   - The label is a message key the preset's vocabulary may override.
   - A kind no installed module declares does not compile.
   - The contract test checks unique ids, a module the preset enables, the parameters, the label in the four
     languages, and categories the seed holds.

## Configure your business

Decision record: [ADR 0006](../adr/0006-registries-permissions-navigation.md) (the spec 008 amendment).

1. In your preset's `settingsDefaults` (`src/verticals/<preset>/index.ts`), set `business.profile` (trade name,
   legal name, tax ID, email, phone, website, address lines), `business.payment` (account holder, account number,
   bank) and `business.invoicing` (default tax, the rate of each tax, payment terms in days). The schemas are in
   `src/core/business`; the demo companies in `src/verticals/<preset>/business.ts` are fictional and show the shape.
2. The owner can change them at runtime on the Settings page (`/dashboard/settings`), or an assistant through
   `settings_values_update`; the invoice reads them on every request.
3. To make another setting editable, give it the permission of the role that may change it. A setting another
   capability owns declares `writtenBy`, and `settings.values.update` refuses it, as it does for the approval policy.

`src/config/settings.test.ts` checks that every preset's values parse against the schemas.

## Wire a control

Decision records: [ADR 0005](../adr/0005-data-seam.md), [0007](../adr/0007-i18n-typed-dictionaries.md),
[0015](../adr/0015-window-rules.md). The reference screen is `src/app/(main)/dashboard/customers`.

- **A read** happens on the server: `const { client } = await getRuntime()`, then
  `client.call("<capability>", input)`. The screen shows the outcome through `ReadState`; an error is never an empty
  list.
- **A write** is a Server Action that calls `runWrite("<capability>", input, attemptKey)`
  (`src/config/write-action.server.ts`). Run it from the client with `useCapabilityAction`, inside the window the job
  calls for, and add the action to the inventory in `src/config/server-actions.test.ts`.
- **Access.** Hide what the actor cannot do with `can()`.
- **Words.** Take every visible word from the screen's dictionary, in all four languages.

## Swap the adapter

Decision record: [ADR 0005](../adr/0005-data-seam.md).

1. The app reaches data only through the `Adapter` interface (`src/core/client/index.ts`): one `dispatch` per
   capability call. Implement it for your backend.
2. Select it by `DATA_ADAPTER` in `getAdapter` (`src/config/data.server.ts`).
3. Run the shared contract against it with `describeAdapterContract` (`src/config/adapter-contract.testkit.ts`), as
   `src/config/data.server.test.ts` does for the in-memory adapter.

## Expose a capability to MCP

Decision records: [ADR 0009](../adr/0009-mcp-server.md), [0016](../adr/0016-mcp-server-as-its-own-product.md).

1. **Classify it** in `MCP_MANIFEST` (`src/config/mcp-manifest.ts`): `expose: true` with the `title` clients show, or
   `uiOnly` with the reason.
   - A small read needs nothing else.
   - A list tool returns `concise` rows.
   - `ids` names the tools that list valid values for an id field.
   - `untrusted` marks free text people typed.
2. **Pin what an agent sees** (annotations, tier and key requirement) in the `PINNED` table of
   `src/config/mcp.server.test.ts`. The test lists every tool in name order and fails on a tool it does not know.
3. **Regenerate the reference** with `npm run mcp:reference` before `npm test`; the reference test fails while
   [`docs/mcp/reference.md`](../mcp/reference.md) is stale.

The tool's input, output and permission are the capability's own, and a write the approval policy holds waits for a
person in the bell. The MCP Worker serves it over Streamable HTTP, and `npm run mcp:stdio` over stdio.
