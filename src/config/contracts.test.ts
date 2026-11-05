import { describe, expect, it } from "vitest";
import { z } from "zod";

import { catalogPermissions, KERNEL_MODULES, moduleOf, permissionsOf, ROLE_IDS } from "@/core/access";
import { descriptorViolations } from "@/core/capability";
import {
  assertDictionaryParity,
  flattenMessages,
  LOCALES,
  type Locale,
  type Message,
  placeholderSignature,
  type Vocabulary,
} from "@/core/i18n";
import { compositionProblems, type InstalledModule, valuesAt } from "@/core/module";
import type { NavEntry } from "@/core/nav";
import { hospitality } from "@/verticals/hospitality";
import { hospitalitySeed, hospitalityVocabulary } from "@/verticals/hospitality/server";
import { salon } from "@/verticals/salon";
import { salonSeed, salonVocabulary } from "@/verticals/salon/server";
import { workshop } from "@/verticals/workshop";
import { workshopSeed, workshopVocabulary } from "@/verticals/workshop/server";

import { CATALOG } from "./catalog";
import { MODULES } from "./modules.generated";
import { MODULE_SERVERS } from "./modules.server.generated";
import { SETTINGS } from "./settings";
import { type ExtensionEntity, VERTICALS, type VerticalId, type VerticalPreset } from "./vertical";
import { MODULE_MESSAGES } from "./vocabulary.server";

interface PresetUnderTest {
  readonly id: VerticalId;
  readonly preset: VerticalPreset;
  readonly seed: Readonly<Record<string, readonly unknown[]>>;
  readonly vocabulary: Vocabulary;
}

const presets: readonly PresetUnderTest[] = [
  { id: "hospitality", preset: hospitality, seed: hospitalitySeed, vocabulary: hospitalityVocabulary },
  { id: "salon", preset: salon, seed: salonSeed, vocabulary: salonVocabulary },
  { id: "workshop", preset: workshop, seed: workshopSeed, vocabulary: workshopVocabulary },
];

/** Every seed collection with the module that declares it: its row schema, whether it is required, its `ext` slot. */
const collections = MODULES.flatMap(({ id, seed }) =>
  Object.entries(seed).map(([key, collection]) => ({ module: id, key, ...collection })),
);
const seedSchemas = collections.map(({ key, schema }) => [key, schema] as const);

/** Which seed collection feeds each `ext` slot, and whether a row may leave it out (a booking may; the rest may not). */
const extSlots = collections.flatMap(({ key, ext }) => (ext ? [[ext.entity, key, ext.optional] as const] : []));
const extEntities: readonly string[] = extSlots.map(([entity]) => entity);

/** `<module>.<path>` -> message, per locale. */
const knownMessages = Object.fromEntries(
  LOCALES.map((locale) => [
    locale,
    new Map(
      Object.entries(MODULE_MESSAGES).flatMap(([moduleId, dictionary]) =>
        [...flattenMessages(dictionary[locale])].map(([path, message]) => [`${moduleId}.${path}`, message] as const),
      ),
    ),
  ]),
) as Record<Locale, Map<string, Message>>;

const catalogEntries = Object.entries(CATALOG);
const cataloguePermissions = [...new Set(catalogEntries.map(([, capability]) => capability.permission))];
const catalogModules = new Set(catalogEntries.map(([id]) => moduleOf(id)));

const duplicates = (ids: readonly string[]) => ids.filter((id, index) => ids.indexOf(id) !== index);
const isSubset = (small: ReadonlySet<string>, large: ReadonlySet<string>) =>
  [...small].every((permission) => large.has(permission));

/** Modules a nav entry depends on: its explicit gate plus the module of every capability carrying its permission. */
function modulesOfEntry(entry: NavEntry): string[] {
  const fromPermission = catalogEntries
    .filter(([, capability]) => capability.permission === entry.requiredPermission)
    .map(([id]) => moduleOf(id));
  return [...fromPermission, ...(entry.requiredModule ? [entry.requiredModule] : [])];
}

/** Whether a vocabulary override differs in shape (string vs plural) or placeholders from the module message. */
function driftsFrom(vocabulary: Vocabulary, key: string, locale: Locale): boolean {
  const base = knownMessages[locale].get(key);
  const override = vocabulary[key]?.[locale];
  return (
    base === undefined ||
    override === undefined ||
    typeof base !== typeof override ||
    placeholderSignature(base) !== placeholderSignature(override)
  );
}

/** Each server half's mock answers and its manifest's capabilities, by module id. */
const capabilitiesOf = new Map(MODULES.map(({ id, capabilities }) => [id, Object.keys(capabilities).sort()]));
const serverHalves = MODULE_SERVERS.map(
  ({ id, mockHandlers }) => [id, Object.keys(mockHandlers).sort(), capabilitiesOf.get(id)] as const,
);

describe("module server halves (ADR 0017 §1)", () => {
  it.each(serverHalves)("%s answers exactly its own capabilities", (_id, handlers, capabilities) => {
    expect(handlers).toEqual(capabilities);
  });
});

/** Every namespace the kernel takes in the composition: capability prefixes, message namespaces, setting prefixes. */
const moduleIds: ReadonlySet<string> = new Set(MODULES.map(({ id }) => id));
const kernelNamespaces = [
  ...new Set([
    ...Object.keys(CATALOG).map(moduleOf),
    ...Object.keys(MODULE_MESSAGES),
    ...Object.keys(SETTINGS).map(moduleOf),
  ]),
]
  .filter((namespace) => !moduleIds.has(namespace))
  .sort();
const named = (id: string): InstalledModule => ({
  folder: id,
  manifest: {
    id,
    capabilities: {},
    settings: [],
    mcp: { noun: "nothing", idSources: [], tools: {} },
    seed: {},
    references: [],
    owns: [],
  },
});

describe("kernel namespaces (ADR 0017 §5)", () => {
  it.each(kernelNamespaces)("refuses a module named %s, which would overwrite the kernel's", (namespace) => {
    expect(compositionProblems([named(namespace)], [], () => true)).toEqual([
      `src/modules/${namespace}: "${namespace}" is a kernel namespace; rename the module`,
    ]);
  });
});

/**
 * Each data reference once, as (collection, field, target): notifications' reference repeats bookings' own. A target's
 * ids are the rows of the collection named like it, which every referenced module seeds.
 */
const references = [
  ...new Map(
    MODULES.flatMap(({ references: declared }) =>
      declared.map(
        ({ collection, field, module }) => [`${collection}.${field}>${module}`, [collection, field, module]] as const,
      ),
    ),
  ).values(),
];
/** A target may be an optional module that is not installed: it has no seed to check. */
const referencedModules = [...new Set(references.map(([, , module]) => module))]
  .filter((module) => moduleIds.has(module))
  .sort();

describe("data references (ADR 0017 §3)", () => {
  it.each(referencedModules)("%s seeds the collection named like it, which references point at", (module) => {
    expect(Object.keys(MODULES.find(({ id }) => id === module)?.seed ?? {})).toContain(module);
  });
});

describe("presets under test", () => {
  it("are exactly the registered verticals", () => {
    expect(presets.map(({ id }) => id).sort()).toEqual(Object.keys(VERTICALS).sort());
  });

  it.each(presets)("$id is registered under its own id with the preset it declares", ({ id, preset }) => {
    expect([VERTICALS[id], preset.id]).toEqual([preset, id]);
  });
});

describe.each(presets)("$id preset", ({ preset, seed, vocabulary }) => {
  const seedKeys = seedSchemas.map(([key]) => key);
  const enabled: readonly string[] = preset.modules;
  const required = collections.filter((collection) => collection.required && enabled.includes(collection.module));
  const permissioned = preset.nav.flatMap((entry) =>
    entry.requiredPermission ? [[entry.id, entry.requiredPermission] as const] : [],
  );

  describe("seed", () => {
    it("has only collections the contracts know", () => {
      expect(Object.keys(seed).filter((key) => !seedKeys.includes(key))).toEqual([]);
    });

    it.each(required.map(({ key }) => key))("has a non-empty %s collection", (key) => {
      expect(seed[key]).not.toHaveLength(0);
    });

    it.each(seedSchemas)("parses the %s collection with its module schema", (key, schema) => {
      expect(z.array(schema).safeParse(seed[key] ?? []).error).toBeUndefined();
    });

    it.each(seedSchemas)("has unique ids in %s", (key) => {
      expect(duplicates((seed[key] ?? []).map((row) => (row as { id: string }).id))).toEqual([]);
    });

    it("types ext only for entities whose module seeds them", () => {
      expect(Object.keys(preset.extensions).filter((entity) => !extEntities.includes(entity))).toEqual([]);
    });

    const slots = extSlots.map(([entity, key, optional]) => {
      const schema = preset.extensions[entity as ExtensionEntity] ?? z.undefined();
      return [entity, key, z.array(optional ? schema.optional() : schema)] as const;
    });

    it.each(slots)("parses the %s ext slots of %s with the preset's schema, or has none", (_entity, key, schema) => {
      expect(schema.safeParse((seed[key] ?? []).map((row) => (row as { ext?: unknown }).ext)).error).toBeUndefined();
    });

    const enabledReferences = references.filter(
      ([collection, , module]) =>
        enabled.includes(module) &&
        collections.some(({ key, module: owner }) => key === collection && enabled.includes(owner)),
    );

    it.each(enabledReferences)("names only existing rows in %s.%s, which point at %s", (collection, field, module) => {
      const known = new Set((seed[module] ?? []).map((row) => (row as { id: string }).id));
      const named = (seed[collection] ?? []).flatMap((row) => valuesAt(row, field));
      expect(named.filter((id) => !known.has(id as string))).toEqual([]);
    });
  });

  describe("product views (ADR 0018 §3)", () => {
    const kinds = new Map(MODULES.flatMap(({ views }) => (views ?? []).map((kind) => [kind.id, kind] as const)));
    const views = preset.productViews.map((view) => [view.id, view] as const);
    const seededCategories = (seed.catalog ?? []).map((item) => (item as { categoryId: string }).categoryId);
    const labels = views.flatMap(([id, view]) => LOCALES.map((locale) => [id, locale, view.labelKey] as const));
    const categories = preset.productViews.flatMap((view) =>
      view.kind === "catalog.collection"
        ? (view.params as { categoryIds: readonly string[] }).categoryIds.map(
            (category) => [view.id, category] as const,
          )
        : [],
    );

    it("has unique view ids", () => {
      expect(duplicates(preset.productViews.map(({ id }) => id))).toEqual([]);
    });

    it.each(views)("%s names a declared kind of a module the preset enables", (_id, view) => {
      expect(enabled).toContain(kinds.get(view.kind)?.module);
    });

    it.each(views)("%s gives parameters its kind accepts", (_id, view) => {
      expect(kinds.get(view.kind)?.params.safeParse(view.params).error).toBeUndefined();
    });

    it.each(labels)("%s has a label in %s", (_id, locale, key) => {
      expect(typeof (vocabulary[key]?.[locale] ?? knownMessages[locale].get(key))).toBe("string");
    });

    it.each(categories)("%s lists category %s, which the seed's catalog holds", (_id, category) => {
      expect(seededCategories).toContain(category);
    });
  });

  describe("registries", () => {
    const entries = preset.nav.map((entry) => [entry.id, entry] as const);

    it("has unique nav ids and hrefs", () => {
      expect([
        ...duplicates(preset.nav.map((entry) => entry.id)),
        ...duplicates(preset.nav.map((e) => e.href)),
      ]).toEqual([]);
    });

    it.each(preset.modules)("enables %s, which has capabilities", (moduleId) => {
      expect([...catalogModules]).toContain(moduleId);
    });

    it.each(entries)("gates nav entry %s (fail-closed)", (_id, entry) => {
      expect([entry.requiredPermission, entry.requiredModule].filter(Boolean)).not.toHaveLength(0);
    });

    it.each(permissioned)("nav entry %s requires a permission that exists in the catalogue", (_id, permission) => {
      expect(cataloguePermissions).toContain(permission);
    });

    it.each(entries)("nav entry %s refers only to enabled modules", (_id, entry) => {
      const available: readonly string[] = [...KERNEL_MODULES, ...preset.modules];
      expect(modulesOfEntry(entry).filter((moduleId) => !available.includes(moduleId))).toEqual([]);
    });

    it.each(entries)("nav entry %s has a group label in every locale", (_id, entry) => {
      expect(LOCALES.map((locale) => typeof knownMessages[locale].get(`nav.groups.${entry.group}`))).toEqual(
        LOCALES.map(() => "string"),
      );
    });

    it.each(entries)("nav entry %s has a text label in every locale", (_id, entry) => {
      expect(LOCALES.map((locale) => typeof knownMessages[locale].get(entry.labelKey))).toEqual(
        LOCALES.map(() => "string"),
      );
    });
  });

  describe("roles", () => {
    const grants = (id: string) => {
      const role = preset.roles.find((candidate) => candidate.id === id);
      return new Set(role ? permissionsOf(role, CATALOG, preset.modules) : []);
    };
    const roles = preset.roles.map((role) => [role.id, role] as const);

    it("defines owner, manager and staff once each", () => {
      expect(preset.roles.map((role) => role.id)).toEqual([...ROLE_IDS]);
    });

    it.each(roles)("labels role %s with a text message in every locale", (_id, role) => {
      expect(LOCALES.map((locale) => typeof knownMessages[locale].get(role.labelKey))).toEqual(
        LOCALES.map(() => "string"),
      );
    });

    it("keeps owner above manager above staff", () => {
      expect([isSubset(grants("manager"), grants("owner")), isSubset(grants("staff"), grants("manager"))]).toEqual([
        true,
        true,
      ]);
    });

    it("gives the owner exactly the permissions of the enabled modules", () => {
      expect([...grants("owner")].sort()).toEqual(catalogPermissions(CATALOG, preset.modules));
    });

    it.each(permissioned)("lets staff open nav entry %s", (_id, permission) => {
      expect([...grants("staff")]).toContain(permission);
    });
  });

  describe("vocabulary", () => {
    it("passes the dictionary parity check", () => {
      const byLocale = Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          Object.fromEntries(Object.keys(vocabulary).map((key) => [key, vocabulary[key]?.[locale]])),
        ]),
      ) as Record<Locale, unknown>;
      expect(() => assertDictionaryParity(byLocale)).not.toThrow();
    });

    it.each(Object.keys(vocabulary))("overrides %s, which exists with the same shape and placeholders", (key) => {
      expect(LOCALES.filter((locale) => driftsFrom(vocabulary, key, locale))).toEqual([]);
    });
  });
});

describe("module messages", () => {
  it.each(Object.entries(MODULE_MESSAGES))("%s passes the dictionary parity check", (_module, dictionary) => {
    expect(() => assertDictionaryParity(dictionary)).not.toThrow();
  });
});

describe("catalogue", () => {
  it.each(catalogEntries)("%s has a permission of the form action:resource", (_id, capability) => {
    expect(capability.permission).toMatch(/^[a-z]+:[a-z.]+$/);
  });

  it.each(cataloguePermissions)("%s has one effect and one elevated flag across its capabilities", (permission) => {
    const carriers = catalogEntries.map(([, c]) => c).filter((capability) => capability.permission === permission);
    expect([
      new Set(carriers.map((capability) => capability.effect)).size,
      new Set(carriers.map((capability) => capability.elevated === true)).size,
    ]).toEqual([1, 1]);
  });
});

describe("capability descriptor invariants", () => {
  it.each(catalogEntries)("%s breaks no descriptor rule", (_id, capability) => {
    expect(descriptorViolations(capability)).toEqual([]);
  });
});
