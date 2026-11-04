# ADR 0018 — Products: what a business sells and what it keeps, shown in the views each preset picks

Status: accepted (owner, 2026-11-04) · Date: 2026-11-04 · Related: ADR 0003, 0004, 0005, 0006, 0015 · Amends: ADR 0004 (domain table),
ADR 0006 (the first view registry in code)

> **Amended 2026-11-04 (ADR 0019):** `Supplier` leaves `inventory`. A supplier is a `parties` record with the
> `supplier` role, and `StockItem.supplierId` and `PurchaseOrder.supplierId` name it through an optional reference;
> `inventory` reads parties and never writes them.

## Context

The owner asked for a Products screen that shows, through a toggle, the views that fit the business:

| Preset | First view | Second view |
| --- | --- | --- |
| Hospitality | The menu | The shop |
| Workshop | Parts | What it orders from suppliers |
| Salon | The shop | Stock, with each product's supplier |

What the code has:

- **`/dashboard/products` is a showcase.** It shows 24 static e-commerce rows, the same in every preset, and reads no
  capability.
- **The `catalog` module is thin.** `CatalogItem` has a kind, a `categoryId`, a price and a status; its only
  capability is `catalog.list`.
- **Nothing generic models stock, suppliers or purchase orders.** The workshop keeps a part's `sku`, `stock` and
  `supplier` in the item's `ext`, a preset extension. The salon now needs the same for its retail products, and
  by ADR 0004's rule a field becomes generic when two presets need it.
- **View registries are decided but not built.** ADR 0006 sets their rules (serialisable descriptors declared by
  modules, lists owned by presets, a contract test); "Booking views" is its example.

**Constraints:**

- **Writes stay inside a module.** A module never writes another module's data (ADR 0004).
- **Data goes through the seam.** Every screen reads through capabilities (ADR 0005).
- **Generic layers carry no preset words**, as the leak test checks (ADR 0004).
- **Modules are becoming folders** with a manifest that a generator composes (006 Phase 1, ADR 0017 to come).

## Decision

### 1. Selling and keeping are two domains

| Module | Owns | Contract |
| --- | --- | --- |
| **catalog** (exists) | What the business sells | `CatalogItem`, unchanged |
| **inventory** (new) | What the business keeps and buys | `StockItem {id, name (i18n field), sku, catalogItemId?, unit, onHand, reorderPoint, supplierId?}`, `Supplier {id, name, email?, phone?, leadTimeDays?}`, `PurchaseOrder {id, supplierId, status draft \| sent \| received \| cancelled, lines[] (stockItemId, qty, unitCost: Money), orderedOn, expectedOn?}` |

- **Stock is not only what is sold.** A `StockItem` links to a catalog item only when the business also sells it: a
  salon keeps the dye it uses in services, and a workshop keeps the parts it fits and sells.
- **Receiving an order stays in one module.** It changes the purchase order and the stock levels, which is why
  stock, suppliers and orders share `inventory` instead of splitting purchasing out.
- **A stock item names itself.** Its `name` is the buying name and may differ from the selling name of the item it
  links to. The link is a soft reference: a stock item whose catalog item is gone keeps its name and its stock.
- **`inventory` reads catalog ids and never writes the catalog.**
- **The workshop's stock fields move.** Today a part keeps `sku`, `stock` and `supplier` in its catalog `ext`. When
  `inventory` lands (plan 010 P3), they become `StockItem` and `Supplier` rows linked to the part, and that branch of
  the workshop's `ext` union is removed, so stock has one owner.

### 2. A collection is the preset's, over categories

A catalog view is a named set of `categoryId`s that the preset declares: the menu is starters, mains, desserts and set
menus; the shop is `shop`. `CatalogItem` gains no field. `catalog.list` takes an optional `categoryIds` filter.

### 3. Product views are a registry

The rules are ADR 0006's, applied for the first time.

- **Kinds are declared by modules.** A view kind is a serialisable descriptor made with `defineViewKind` in
  `src/core/views`. It holds its id, `<module>.<view>`; its module; the read capability it calls, whose permission it
  needs; and the schema of its parameters. `src/core/views` also holds the `ViewEntry` type a preset lists. Booking
  views reuse it when they are built.
  - `catalog` declares `catalog.collection`, whose parameter is `categoryIds`.
  - `inventory` declares `inventory.stock` and `inventory.orders`.
  - `src/config` merges the kinds; after ADR 0017 the generator composes them from the manifests.
- **Views are listed by presets.** A preset lists its views in order under `productViews`. Each entry is
  `{ id, kind, labelKey, params }`; the module and the permission come from the kind, so they cannot disagree. Its
  label comes from the preset vocabulary, in the four languages. `kind` is typed as the union of the declared kind
  ids, so removing a module makes `tsc` name each entry that uses it.
- **The route renders what is listed.** The Products route shows a segmented control with the views whose module is
  enabled, in the preset's order. Each kind's rendering is a client component that the route maps by kind id
  (ADR 0006: behaviour lives in a component reference, data in the descriptor).
- **It fails closed at runtime.** A view whose module is off, or whose capability the actor may not call, is hidden.
  The route shows the views the actor may read and its forbidden state when there are none.
- **A configuration error fails the build.** A contract test checks every preset, as ADR 0006 requires:
  - unique view ids;
  - each entry names a declared kind whose module the preset enables (a typo or a disabled module fails);
  - its parameters parse;
  - its label resolves in all four locales;
  - its categories exist in the preset's seed.

### 4. The route becomes product

- `/dashboard/products` reads only through capabilities. It joins each preset's nav, gated by `read:catalog`
  (every preset that offers products sells something), and leaves `examplesNav`. Inside, each view needs its own
  read permission.
- The static e-commerce data is deleted.
- Windows follow ADR 0015: the add window becomes the kit's `FormDialog` when the first write lands.

### 5. Reads first

The views and their MCP read tools come first. Writes come after, each one its own capability with idempotency and a
place in the approval policy: an item created, stock adjusted, an order raised or received.

### 6. Born in the module seam

`inventory` is created as a module folder with its manifest once ADR 0017's manifests and generator exist. Its
manifest declares its view kinds and capabilities, so removing it with the generator removes its views and tools.

## Consequences

- **Adding a view to a preset** is one list entry and its labels.
- **Adding a view kind** is a declaration in a module and one rendering component in the route.
- **Removing a module** follows 006 AC4: `tsc` and the contract test name each preset entry that uses its views;
  removing those entries brings the gates back to green.
- **A demo company now has stock and suppliers.** The seeds grow by a few rows per preset.
- **The MCP server gains read tools:** `inventory_stock_list`, `inventory_orders_list` and `suppliers_list`;
  `catalog_list` gains the filter.
- **No engine is created.** The products route is the registry's only consumer; ADR 0003's rule (an engine with its
  second consumer) stands.

## Alternatives considered

- **Stock and suppliers in `catalog`.** Rejected: it mixes selling with buying, and every preset would carry stock
  fields it may not use.
- **Separate `inventory` and `purchasing` modules.** Rejected for now: receiving an order would write another
  module's data. Revisit when a preset needs purchasing without stock.
- **A `collection` field on `CatalogItem`.** Rejected: it puts a preset concept in a generic contract, and categories
  already carry it.
- **Tabs hard-coded per preset in the route.** Rejected: it is not plug and play, and it ignores ADR 0006.

## Amendments to earlier records

- **ADR 0004, domain table:** `inventory` joins the generic modules with the contract above. Hospitality keeps
  drinks and shop goods, the salon its retail and professional products, the workshop its parts.
- **ADR 0006, registries:** product views are the first registry in code, in `src/core/views`. The module and the
  permission of an entry come from its kind; the contract test keeps ADR 0006's rule that every entry refers to an
  enabled module.
