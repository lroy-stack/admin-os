import "server-only";

import { VIEW_RENDERERS } from "@/config/modules.client.generated";
import { MODULE_SERVERS } from "@/config/modules.server.generated";
import { getRuntime } from "@/config/runtime";
import type { ProductViewKindId } from "@/config/vertical";
import { textFor } from "@/config/vocabulary.server";
import { ErrorCodes } from "@/core/errors";
import { defineMessages, type ErrorMessages, errorText, type MessageBundle } from "@/core/i18n";
import type { ModuleServer } from "@/core/module";
import type { ReadStatus } from "@/core/result";
import type { ViewData, ViewLoader } from "@/core/views";

import { readableViews } from "./views.server";

/** The refusal has no module of its own to speak for it: the class text of `forbidden` is enough. */
const classTextsOnly = defineMessages<ErrorMessages>({ en: {}, es: {}, de: {}, fr: {} });

/** One view the viewer may read, with the answer of its kind's loader. */
export interface LoadedView {
  readonly id: string;
  readonly kind: ProductViewKindId;
  /** The label in the preset's words. */
  readonly label: string;
  readonly data: ViewData;
}

export interface LoadedProducts {
  /** The views the viewer may read, in the preset's order. */
  readonly views: LoadedView[];
  /** The dictionaries the shown renderers read, once each. */
  readonly bundles: MessageBundle<unknown>[];
  /** Set when no view is readable. */
  readonly refusal?: { readonly state: ReadStatus; readonly reason: string };
}

const servers: readonly ModuleServer[] = MODULE_SERVERS;

const isRenderable = (kind: string): kind is ProductViewKindId => Object.hasOwn(VIEW_RENDERERS, kind);

/** The server half of a kind: its loader and its dictionary, from the module that declares it (ADR 0017 §5). */
function serverHalfOf(kind: string): { loader: ViewLoader; bundle: MessageBundle<unknown> } {
  const loader = servers.find(({ viewLoaders }) => viewLoaders !== undefined && kind in viewLoaders)?.viewLoaders?.[
    kind
  ];
  const bundle = servers.find(({ viewBundles }) => viewBundles !== undefined && kind in viewBundles)?.viewBundles?.[
    kind
  ];
  if (loader === undefined || bundle === undefined) {
    throw new Error(`The view kind "${kind}" has no loader or no dictionary in its module's server half.`);
  }
  return { loader, bundle };
}

/**
 * Loads the views the viewer may see (ADR 0018 §3, §4), all at once, each through the loader of its kind. The route
 * knows no module: the kinds, their loaders and their renderers come from the generated lists.
 */
export async function loadProducts(): Promise<LoadedProducts> {
  const { client, actor, vertical, locale } = await getRuntime();
  const entries = readableViews(vertical.productViews, vertical.modules, actor.permissions).filter(({ kind }) =>
    isRenderable(kind),
  );

  if (entries.length === 0) {
    const code = ErrorCodes.forbidden;
    return {
      views: [],
      bundles: [],
      refusal: { state: { status: "forbidden", code }, reason: errorText({ code }, classTextsOnly, locale) },
    };
  }

  const context = { locale, call: (capability: string, input: unknown) => client.call(capability, input) };
  const loaded = await Promise.all(
    entries.map(async (entry) => {
      const { loader, bundle } = serverHalfOf(entry.kind);
      return { entry, bundle, data: await loader(context, entry.params) };
    }),
  );
  return {
    views: loaded.flatMap(({ entry, data }) =>
      isRenderable(entry.kind)
        ? [{ id: entry.id, kind: entry.kind, label: textFor(vertical.id, locale, entry.labelKey), data }]
        : [],
    ),
    bundles: [...new Set(loaded.map(({ bundle }) => bundle))],
  };
}
