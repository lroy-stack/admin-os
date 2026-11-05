import { describe, expect, it } from "vitest";
import { z } from "zod";

import { defineCapability } from "@/core/capability";
import { defineSetting } from "@/core/settings";

import {
  compositionProblems,
  defineModule,
  type InstalledModule,
  isStringField,
  type ModuleEdge,
  type ModuleManifest,
  moduleEdges,
  requiresOf,
} from "./index";

const plantedGet = defineCapability({
  id: "planted.item.get",
  summary: "Read one planted item.",
  input: z.object({ id: z.string() }),
  output: z.object({}),
  permission: "read:planted",
  effect: "read",
  riskTier: 0,
});
const plantedList = defineCapability({
  id: "planted.list",
  summary: "List planted items.",
  input: z.object({}),
  output: z.object({}),
  permission: "read:planted",
  effect: "read",
  riskTier: 0,
});
const otherList = defineCapability({
  id: "other.list",
  summary: "List other items.",
  input: z.object({}),
  output: z.object({}),
  permission: "read:other",
  effect: "read",
  riskTier: 0,
});
const capabilities = { "planted.item.get": plantedGet, "planted.list": plantedList } as const;

const plantedRow = z.object({
  id: z.string(),
  otherId: z.string().optional(),
  otherIds: z.array(z.string()),
  lines: z.array(z.object({ otherId: z.string(), quantity: z.number() })),
});

const planted = defineModule({
  id: "planted",
  capabilities,
  settings: [],
  mcp: {
    tools: {
      "planted.item.get": { expose: true, title: "Get an item", ids: { id: ["planted.list", "other.list"] } },
      "planted.list": { uiOnly: "Not for assistants" },
    },
  },
  seed: { planted: { schema: plantedRow, required: true, ext: { entity: "plantedItem", optional: false } } },
  references: [
    { collection: "planted", field: "otherId", module: "other", required: false },
    { collection: "planted", field: "lines[].otherId", module: "other", required: true },
  ],
  owns: ["src/app/planted", "e2e/planted.spec.ts"],
});

const other = defineModule({
  id: "other",
  capabilities: { "other.list": otherList },
  settings: [],
  mcp: { tools: { "other.list": { expose: true, title: "List other items" } } },
  seed: { others: { schema: z.object({ id: z.string() }), required: false } },
  references: [],
  owns: [],
});

const EXISTING = new Set(["src/app/planted", "src/app/planted/page.tsx", "src/app/plant", "e2e/planted.spec.ts"]);
const exists = (path: string) => EXISTING.has(path);

const installed = (...manifests: readonly ModuleManifest[]): InstalledModule[] =>
  manifests.map((manifest) => ({ folder: manifest.id, manifest }));

describe("defineModule (ADR 0017 §1)", () => {
  it("returns the manifest it is given", () => {
    const manifest = { ...planted };
    expect(defineModule(manifest)).toBe(manifest);
  });

  it("keeps a hint to another module's tool as a literal, for the composition root to check", () => {
    const hints: readonly ["planted.list", "other.list"] = planted.mcp.tools["planted.item.get"].ids.id;
    expect(hints).toEqual(["planted.list", "other.list"]);
  });

  it("does not compile when a capability is left unclassified", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        // @ts-expect-error `planted.list` has no entry, so the manifest does not cover the module's catalogue.
        tools: { "planted.item.get": { expose: true, title: "Get an item" } },
      },
    });
    expect(Object.keys(manifest.mcp.tools)).not.toContain("planted.list");
  });

  it("does not compile when an entry names no capability of the module", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        tools: {
          "planted.item.get": { expose: true, title: "Get an item" },
          "planted.list": { expose: true, title: "List items" },
          // @ts-expect-error `planted.find` is not a capability of the module.
          "planted.find": { expose: true, title: "Find items" },
        },
      },
    });
    expect(Object.keys(manifest.mcp.tools)).toContain("planted.find");
  });

  it("does not compile when an id hint names a field the capability has no input for", () => {
    const manifest = defineModule({
      ...planted,
      mcp: {
        tools: {
          // @ts-expect-error `itemId` is not an input field of `planted.item.get`.
          "planted.item.get": { expose: true, title: "Get an item", ids: { itemId: ["planted.list"] } },
          "planted.list": { expose: true, title: "List items" },
        },
      },
    });
    expect(manifest.mcp.tools["planted.item.get"]).toHaveProperty("ids");
  });

  it("does not compile when a capability is outside the module's prefix", () => {
    const manifest = defineModule({
      ...planted,
      id: "plants",
      // @ts-expect-error `planted.*` capabilities do not start with `plants.`.
      capabilities,
    });
    expect(manifest.id).toBe("plants");
  });
});

describe("isStringField (ADR 0017 §3)", () => {
  it.each([
    ["otherId", true],
    ["otherIds[]", true],
    ["lines[].otherId", true],
    ["lines[].quantity", false],
    ["lines.otherId", false],
    ["otherIds", false],
    ["missing", false],
    ["otherId[]", false],
  ] as const)("%s → %s", (path, expected) => {
    expect(isStringField(plantedRow, path)).toBe(expected);
  });

  const formats = z.object({
    uuid: z.uuid(),
    email: z.email(),
    code: z.templateLiteral(["bk_", z.string()]),
    caught: z.string().catch("x"),
    nonOptional: z.string().optional().nonoptional(),
    prefaulted: z.string().prefault("x"),
    lazy: z.lazy(() => z.string()),
    count: z.number().catch(0),
  });

  it.each([
    ["uuid", true],
    ["email", true],
    ["code", true],
    ["caught", true],
    ["nonOptional", true],
    ["prefaulted", true],
    ["lazy", true],
    ["count", false],
  ] as const)("counts the string format or wrapper %s → %s", (path, expected) => {
    expect(isStringField(formats, path)).toBe(expected);
  });

  it("reads through optional, default and pipe wrappers", () => {
    const wrapped = z.object({ lines: z.array(z.object({ otherId: z.string().default("x") })).optional() }).readonly();
    expect(isStringField(wrapped.pipe(z.any()), "lines[].otherId")).toBe(true);
  });
});

describe("compositionProblems (ADR 0017 §1–§3, §7)", () => {
  const problems = (modules: readonly InstalledModule[], pathExists: (path: string) => boolean) =>
    compositionProblems(modules, [], pathExists);

  const optional = { ...planted, references: planted.references.map((ref) => ({ ...ref, required: false })) };
  const kernelHint = {
    ...planted,
    mcp: {
      tools: { ...planted.mcp.tools, "planted.item.get": { expose: true, title: "Get", ids: { id: ["clock.get"] } } },
    },
  } as const;

  it("finds none in consistent manifests", () => {
    expect(problems(installed(planted, other), exists)).toEqual([]);
  });

  it("accepts optional references and hints to a module that is not installed", () => {
    expect(problems(installed(optional), exists)).toEqual([]);
  });

  it("accepts a hint to a kernel tool without a reference, since the kernel is always installed", () => {
    expect(problems(installed(kernelHint, other), exists)).toEqual([]);
  });

  it("does not take a sibling path for an overlap", () => {
    expect(problems(installed(planted, { ...other, owns: ["src/app/plant"] }), exists)).toEqual([]);
  });

  const strayPrefix = defineSetting({
    key: "plants.stay",
    schema: z.number(),
    defaultValue: 1,
    section: "planted",
    permission: "update:settings",
    labelKey: "planted.settings.stay.label",
    descriptionKey: "planted.settings.stay.description",
  });

  it.each([
    [
      "an id that differs from its folder",
      [{ folder: "plants", manifest: planted }, ...installed(other)],
      'src/modules/plants: the manifest\'s id is "planted"; set it to "plants"',
    ],
    [
      "a capability outside the module's prefix",
      installed({ ...planted, capabilities: { ...capabilities, "other.list": otherList } }, other),
      'planted: capabilities other.list must be keyed by their own id, under "planted."',
    ],
    [
      "a capability under a key that is not its id",
      installed({ ...planted, capabilities: { ...capabilities, "planted.extra": plantedList } }, other),
      'planted: capabilities planted.extra must be keyed by their own id, under "planted."',
    ],
    [
      "a setting outside the module's prefix",
      installed({ ...planted, settings: [strayPrefix] }, other),
      'planted: settings plants.stay must start with "planted."',
    ],
    [
      "an owned path that does not exist",
      installed({ ...planted, owns: [...planted.owns, "src/app/gone"] }, other),
      "planted owns src/app/gone, which does not exist; fix the path or remove it from owns",
    ],
    [
      "a path owned by two modules",
      installed(planted, { ...other, owns: ["src/app/planted"] }),
      "src/app/planted (planted) and src/app/planted (other) overlap; a path has one owner",
    ],
    [
      "a path inside another module's owned folder",
      installed(planted, { ...other, owns: ["src/app/planted/page.tsx"] }),
      "src/app/planted (planted) and src/app/planted/page.tsx (other) overlap; a path has one owner",
    ],
    [
      "an owned path with a trailing slash",
      installed(planted, { ...other, owns: ["src/app/planted/"] }),
      'other owns "src/app/planted/"; write it from the repository root, without ".", ".." or an edge "/"',
    ],
    [
      "an owned path that starts with ./",
      installed(planted, { ...other, owns: ["./src/app/plant"] }),
      'other owns "./src/app/plant"; write it from the repository root, without ".", ".." or an edge "/"',
    ],
    [
      "a seed collection declared twice",
      installed(planted, { ...other, seed: { planted: { schema: plantedRow, required: false } } }),
      "the seed collection planted is declared by planted and other; one module owns it",
    ],
    [
      "an ext entity declared twice",
      installed(planted, {
        ...other,
        seed: { others: { ...other.seed.others, ext: { entity: "plantedItem", optional: true } } },
      }),
      "the ext entity plantedItem is declared by planted (planted) and other (others)",
    ],
    [
      "a required reference to a module that is not installed",
      installed(planted),
      "planted requires other; restore src/modules/other or remove planted",
    ],
    [
      "a reference in a collection no installed module seeds",
      installed(
        { ...planted, references: [{ collection: "plants", field: "otherId", module: "other", required: false }] },
        other,
      ),
      "planted's reference plants.otherId → other: no installed module seeds the collection plants",
    ],
    [
      "a reference to a field that is not a string",
      installed(
        {
          ...planted,
          references: [{ collection: "planted", field: "lines[].quantity", module: "other", required: false }],
        },
        other,
      ),
      "planted's reference planted.lines[].quantity → other: lines[].quantity is not a string field of planted's rows",
    ],
    [
      "a hint to an own tool the module does not declare",
      installed(
        {
          ...planted,
          mcp: {
            ...planted.mcp,
            tools: {
              ...planted.mcp.tools,
              "planted.item.get": { expose: true, title: "Get", ids: { id: ["planted.find"] } },
            },
          },
        },
        other,
      ),
      "planted.item.get hints planted.find, which planted does not declare",
    ],
    [
      "a hint to a module the manifest does not reference",
      installed({ ...planted, references: [] }, other),
      "planted.item.get hints other.list, but planted declares no reference to other; add the reference",
    ],
    [
      "a hint to an installed module's tool it does not declare",
      installed(planted, { ...other, capabilities: {}, mcp: { tools: {} } }),
      "planted.item.get hints other.list, which other does not declare",
    ],
  ] as const)("reports %s, and only that", (_case, modules, problem) => {
    expect(problems(modules, exists)).toEqual([problem]);
  });
});

describe("compositionProblems requirements (ADR 0017 §2, §5)", () => {
  const edge = (from: string, to: string, file = `src/modules/${from}/x.ts`): ModuleEdge => ({ from, to, file });
  const REFUSAL = "planted requires other; restore src/modules/other or remove planted";
  const importOnly = { ...planted, references: planted.references.map((ref) => ({ ...ref, required: false })) };

  it("refuses an import of a module that is not installed", () => {
    expect(compositionProblems(installed(importOnly), [edge("planted", "other")], exists)).toEqual([REFUSAL]);
  });

  it("says it once when the import and a required reference name the same module", () => {
    expect(
      compositionProblems(installed(planted), [edge("planted", "other"), edge("planted", "other", "a.ts")], exists),
    ).toEqual([REFUSAL]);
  });

  it("refuses a required reference without an import", () => {
    expect(compositionProblems(installed(planted), [], exists)).toEqual([REFUSAL]);
  });

  it("accepts an import of an installed module", () => {
    expect(compositionProblems(installed(importOnly, other), [edge("planted", "other")], exists)).toEqual([]);
  });

  it("ignores an import by a module that is not installed", () => {
    expect(compositionProblems(installed(other), [edge("planted", "gone")], exists)).toEqual([]);
  });

  it("hides the other problems of a module that lacks a requirement", () => {
    const broken = { ...importOnly, owns: ["src/app/gone"] };
    expect(compositionProblems(installed(broken), [edge("planted", "other")], exists)).toEqual([REFUSAL]);
  });

  it("keeps the problems of the modules that lack nothing", () => {
    const broken = { ...other, owns: ["src/app/gone"] };
    expect(compositionProblems(installed(importOnly, broken), [edge("planted", "gone")], exists)).toEqual([
      "planted requires gone; restore src/modules/gone or remove planted",
      "other owns src/app/gone, which does not exist; fix the path or remove it from owns",
    ]);
  });
});

describe("compositionProblems with folders whose manifest does not load (ADR 0017 §5)", () => {
  const edge = (from: string, to: string): ModuleEdge => ({ from, to, file: `src/modules/${from}/x.ts` });
  const importOnly = { ...planted, references: planted.references.map((ref) => ({ ...ref, required: false })) };
  const brokenOther = { folder: "other", problem: "src/modules/other has no manifest" };
  const brokenGone = { folder: "gone", problem: "src/modules/gone has no manifest; it failed to load" };
  const strayOwner = { ...importOnly, owns: ["src/app/gone"] };

  it("reports the folder, and does not tell a module that imports it to restore a folder that is there", () => {
    expect(compositionProblems(installed(importOnly), [edge("planted", "other")], exists, [brokenOther])).toEqual([
      "src/modules/other has no manifest",
    ]);
  });

  it("hides the other problems of a module that waits on that folder", () => {
    expect(compositionProblems(installed(strayOwner), [edge("planted", "other")], exists, [brokenOther])).toEqual([
      "src/modules/other has no manifest",
    ]);
  });

  it("says a folder that fails to load on a deleted module requires it, instead of its load failure", () => {
    expect(compositionProblems([], [edge("gone", "staff")], exists, [brokenGone])).toEqual([
      "gone requires staff; restore src/modules/staff or remove gone",
    ]);
  });

  it("lists the requirements first, then the folders without a manifest, then the rest", () => {
    const broken = { ...other, owns: ["src/app/missing"] };
    expect(
      compositionProblems(installed(importOnly, broken), [edge("planted", "deleted")], exists, [brokenGone]),
    ).toEqual([
      "planted requires deleted; restore src/modules/deleted or remove planted",
      "src/modules/gone has no manifest; it failed to load",
      "other owns src/app/missing, which does not exist; fix the path or remove it from owns",
    ]);
  });

  it("keeps a problem between two modules while one of them is not refused", () => {
    const twice = { ...other, owns: ["src/app/planted"] };
    expect(compositionProblems(installed(importOnly, twice), [edge("planted", "deleted")], exists)).toEqual([
      "planted requires deleted; restore src/modules/deleted or remove planted",
      "src/app/planted (planted) and src/app/planted (other) overlap; a path has one owner",
    ]);
  });
});

describe("moduleEdges (ADR 0017 §2)", () => {
  const owners = [
    { id: "bookings", owns: ["src/app/(main)/bookings", "e2e/bookings.spec.ts"] },
    { id: "customers", owns: ["src/app/(main)/customers"] },
    { id: "notifications", owns: [] },
  ];
  const edges = (...imports: readonly [file: string, specifier: string, resolved?: string][]) =>
    moduleEdges(
      imports.map(([file, specifier, resolved]) => ({ file, specifier, ...(resolved ? { resolved } : {}) })),
      owners,
    );

  it("takes the target from the resolved path", () => {
    expect(edges(["src/modules/notifications/mock.ts", "@/modules/bookings", "src/modules/bookings/index.ts"])).toEqual(
      [{ from: "notifications", to: "bookings", file: "src/modules/notifications/mock.ts" }],
    );
  });

  it.each([
    ["@/modules/bookings"],
    ["@/modules/bookings/server"],
    ["@/modules/bookings/ui/deeper/path"],
    ["../bookings"],
    ["../bookings/server"],
    ["../../modules/bookings/ui"],
  ])("names the module of an unresolved import %s", (specifier) => {
    expect(edges(["src/modules/notifications/mock.ts", specifier])).toEqual([
      { from: "notifications", to: "bookings", file: "src/modules/notifications/mock.ts" },
    ]);
  });

  it.each([["react"], ["@/core/access"], ["./local"], ["@/modules"]])("ignores %s", (specifier) => {
    expect(edges(["src/modules/notifications/mock.ts", specifier])).toEqual([]);
  });

  it("makes no edge for an import within the module", () => {
    expect(edges(["src/modules/bookings/a.ts", "./b", "src/modules/bookings/b.ts"])).toEqual([]);
  });

  it("belongs an owned file to its module, and counts an import into an owned path", () => {
    expect(
      edges(
        ["src/app/(main)/bookings/page.tsx", "@/app/(main)/customers/x", "src/app/(main)/customers/x.ts"],
        ["e2e/bookings.spec.ts", "@/modules/customers"],
      ),
    ).toEqual([
      { from: "bookings", to: "customers", file: "src/app/(main)/bookings/page.tsx" },
      { from: "bookings", to: "customers", file: "e2e/bookings.spec.ts" },
    ]);
  });

  it("ignores a file that no module owns", () => {
    expect(edges(["src/core/x.ts", "@/modules/bookings", "src/modules/bookings/index.ts"])).toEqual([]);
  });

  it("lists a file once per target however many imports it has", () => {
    expect(
      edges(
        ["src/modules/notifications/mock.ts", "@/modules/bookings", "src/modules/bookings/index.ts"],
        ["src/modules/notifications/mock.ts", "@/modules/bookings/server"],
      ),
    ).toHaveLength(1);
  });
});

describe("requiresOf (ADR 0017 §2)", () => {
  const edge = (from: string, to: string): ModuleEdge => ({ from, to, file: `src/modules/${from}/x.ts` });

  it("has every installed id as a key, sorted by character code, without duplicates or the module itself", () => {
    expect(
      requiresOf(
        [edge("b", "Z"), edge("b", "a"), edge("b", "a"), edge("b", "b"), edge("c", "a"), edge("gone", "a")],
        ["a", "b", "c", "d"],
      ),
    ).toEqual({ a: [], b: ["Z", "a"], c: ["a"], d: [] });
  });
});
