# ADR 0019 — Parties: who a business invoices and buys from, apart from the agenda's customers

Status: accepted (owner, 2026-11-04) · Date: 2026-11-04 · Spec: `docs/specs/011-billing-parties/spec.md` · Amends:
ADR 0004 (domain table), ADR 0018 §1 (suppliers) · Related: ADR 0005, 0006, 0015, 0016

## Context

- **The wrong model.** Spec 008 made the invoice bill the agenda's customers (d378aa2). `customers` keeps people who
  book: phone, consent, VIP, no-shows and visit figures. It holds no fiscal identity, so every invoice went out with
  no tax ID or address. The owner rejected it, and the fix in d1f0dcc went back to fixed billing clients until this
  record lands.
- **What the law asks.** A full invoice in Spain identifies its recipient by name or company name, tax ID and address
  (RD 1619/2012, art. 6). It is the invoice between businesses and the one that lets the recipient deduct VAT. A
  simplified invoice (art. 7), the receipt for a table or a haircut, needs no recipient.
- **How the trade models it.** Holded keeps one directory of contacts, persons or companies, each with a tax ID and a
  fiscal address, for clients and suppliers alike. Odoo keeps customers and vendors in one model, `res.partner`.
  Stripe prints a customer's billing address and tax IDs on its invoices. EN 16931 calls both ends of an invoice a
  party.
- **Suppliers.** ADR 0018 planned a `Supplier` inside `inventory`, with a name and contact data but no fiscal
  identity. No code exists for it yet.

## Decision

### 1. A generic module, `parties`

`Party {id, kind: person | company, legalName, tradeName?, taxId, addressLines, countryCode, email, phone?, roles,
notes?}`:

- `roles` holds `client`, `supplier` or both.
- A party is a fiscal identity. It is never a person who books: the agenda's customers stay in `customers`, and the
  two are not linked. A customer who asks for a full invoice is entered as a party.
- Its capabilities are `parties.list` (filtered by role, searched by name or tax ID), `parties.get`,
  `parties.create` and `parties.update`. Create takes an idempotency key. Both writes need `manage:parties` and are
  `restricted`, so the owner and the manager hold them and staff only read (ADR 0006's role rules). An assistant's
  writes wait for a person under the default approval policy (ADR 0016).

### 2. The invoice bills a client party

"Bill to" lists the parties with the `client` role. The paper prints the party's legal name, tax ID, fiscal address
and email. The fixed list of d1f0dcc is removed.

### 3. Suppliers are parties

ADR 0018's `Supplier` leaves `inventory`. Purchase orders and stock items name a party with the `supplier` role
through an optional reference, `supplierId → parties`. `inventory` reads parties and never writes them.

### 4. No screen of its own

Parties get no page and no navigation entry (owner's decision, 2026-11-05; the `/dashboard/parties` page of f1a7327
duplicated the customers directory and is removed). The invoice's "Bill to" reads client parties, and the MCP tools
read and write them. If people need to keep them on screen, they do it inside the existing customers page, as one
more view of its directory, never as a new route.

### 5. Each preset seeds its own parties

They are fictitious, with tax IDs that cannot be real (`B000002…`) and `.example` addresses:

| Preset | Clients | Suppliers |
| --- | --- | --- |
| Hospitality | An events company, a hotel that orders catering, a self-employed regular | A food distributor, a winery |
| Salon | A hotel spa, a photo studio | A professional cosmetics distributor |
| Workshop | A fleet company, an insurer | Two parts distributors |

### 6. It is born in the module seam

`parties` is a module folder with its manifest, composed by ADR 0017's generator like `inventory` (ADR 0018 §6). The
invoice route reads `parties.list` and belongs to `parties` (its `owns`, ADR 0017 §4); it reads catalog items by
capability id with a local schema, so `parties` gains no dependency on `catalog`.

## Consequences

- One fiscal directory serves invoicing and purchasing, and the agenda keeps only what it needs.
- The invoice prints a valid recipient for a full invoice.
- ADR 0018's views read supplier names through `parties`, and its contract table loses `Supplier`.
- A business that only sells to people at the counter does not need a party: the simplified invoice, with no
  recipient, is a later option.

## Alternatives considered

- **Fiscal fields on `customers`.** Rejected: it mixes people who book with fiscal entities. Many parties never book
  (an insurer, a corporate client), suppliers do not fit, and it is the confusion the owner rejected. §4 leaves one
  door open: a view of parties may live inside the customers page, as a view of its directory; the fiscal data
  stays in `parties`.
- **Billing clients inside the invoice only.** Rejected: no MCP tools and no reuse for suppliers; the issue would
  return with purchase orders. The reason is not the lack of a screen, since §4 gives parties none either.
- **A `Supplier` in `inventory` and a client list elsewhere.** Rejected: it gives two directories for the same kind of
  fiscal identity, and a company that is both a client and a supplier would be entered twice.

## Amendments to earlier records

- **ADR 0004, domain table:** `parties` joins the generic modules, with the contract above.
- **ADR 0018 §1:** `Supplier` leaves `inventory`. `StockItem.supplierId` and `PurchaseOrder.supplierId` name a
  `parties` record with the `supplier` role through an optional reference.
