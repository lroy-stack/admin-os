import { VERTICALS, type VerticalId } from "@/config/vertical";
import type { NavEntry, NavManifest } from "@/core/nav";
import type { ShellNavItem, ShellSearchGroup } from "@/ds/shell";

import type { ExampleLabelId } from "../(examples)/_nav/examples-messages";
import type { ExampleGroup } from "../(examples)/_nav/examples-nav";

/**
 * Plain data the server hands to the shell (ADR 0006): which entries of the active preset the actor may see, and
 * their labels already resolved with the preset vocabulary. Hidden entries are not in it at all.
 */
export interface NavData {
  readonly presetId: VerticalId;
  readonly visibleIds: readonly string[];
  /** Entry id to label. */
  readonly labels: Readonly<Record<string, string>>;
  /** Group id to label. */
  readonly groupLabels: Readonly<Record<string, string>>;
  /** The template's showcase screens come after the preset's entries (demo build only). */
  readonly showExamples: boolean;
}

export interface ShellNav {
  readonly top: readonly ShellNavItem[];
  readonly rail: readonly ShellNavItem[];
  readonly searchGroups: readonly ShellSearchGroup[];
}

function presetNav(data: NavData): ShellNav {
  const manifest: NavManifest = VERTICALS[data.presetId].nav;
  const visible = manifest.filter((entry) => data.visibleIds.includes(entry.id));
  const item = (entry: NavEntry): ShellNavItem => ({
    id: entry.id,
    title: data.labels[entry.id] ?? entry.id,
    url: entry.href,
    icon: entry.icon,
  });
  const pinned = (placement: NavEntry["placement"]) =>
    visible.filter((entry) => entry.placement === placement).map(item);
  return {
    top: pinned("area"),
    rail: pinned("tool"),
    searchGroups: [...new Set(visible.map((entry) => entry.group))].map((group) => ({
      id: group,
      label: data.groupLabels[group] ?? group,
      items: visible
        .filter((entry) => entry.group === group)
        .map(item)
        .map(({ title, ...rest }) => ({ ...rest, label: title, suggested: true })),
    })),
  };
}

function examplesNavOf(groups: readonly ExampleGroup[], text: Readonly<Record<ExampleLabelId, string>>): ShellNav {
  const items = groups.flatMap((group) => group.items);
  const pinned = (placement: "area" | "tool") =>
    items
      .filter((item) => item.placement === placement)
      .map((item) => ({ id: item.id, title: text[item.id], url: item.url, icon: item.icon }));
  return {
    top: pinned("area"),
    rail: pinned("tool"),
    searchGroups: groups.map((group) => ({
      id: group.id,
      label: text[group.id],
      items: group.items.map((item) => ({
        id: item.id,
        label: text[item.id],
        url: item.url,
        icon: item.icon,
        newTab: item.newTab,
        suggested: true,
      })),
    })),
  };
}

/**
 * The shell's three lists: top-nav pills, rail buttons and search groups. The preset's entries come first; the
 * showcase screens follow, each in the same slot (pill, rail button or search group) the template gave them.
 */
export function buildShellNav(
  data: NavData,
  examples: { readonly groups: readonly ExampleGroup[]; readonly text: Readonly<Record<ExampleLabelId, string>> },
): ShellNav {
  const own = presetNav(data);
  if (!data.showExamples) {
    return own;
  }
  const showcase = examplesNavOf(examples.groups, examples.text);
  return {
    top: [...own.top, ...showcase.top],
    rail: [...own.rail, ...showcase.rail],
    searchGroups: [...own.searchGroups, ...showcase.searchGroups],
  };
}
