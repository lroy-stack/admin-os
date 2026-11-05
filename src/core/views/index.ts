import type { z } from "zod";

/**
 * A kind of product view, declared by a module (ADR 0018 §3): a serialisable descriptor naming the module that owns
 * it, the read capability it calls (whose permission the viewer needs) and the schema of the parameters a preset gives
 * each view of this kind. A route maps the kind id to the client component that renders it.
 */
export interface ViewKind<Id extends `${string}.${string}` = `${string}.${string}`, P extends z.ZodType = z.ZodType> {
  readonly id: Id;
  readonly module: string;
  readonly capability: string;
  readonly params: P;
}

/** Identity helper that keeps the literal kind id, so a preset entry naming an undeclared kind does not compile. */
export const defineViewKind = <const Id extends `${string}.${string}`, P extends z.ZodType>(
  kind: ViewKind<Id, P>,
): ViewKind<Id, P> => kind;

/** One view a preset offers, in its order (ADR 0018 §3); the kind gives its module and its permission. */
export interface ViewEntry<Kind extends string = string> {
  readonly id: string;
  readonly kind: Kind;
  /** A message key the preset's vocabulary may override, so the label is in the business's words. */
  readonly labelKey: string;
  /** Parsed by the kind's `params` schema in the contract test. */
  readonly params: unknown;
}
