import "server-only";

import { MODULES } from "@/config/modules.generated";
import { MODULE_SERVERS } from "@/config/modules.server.generated";
import type { WriteCapabilityId } from "@/config/write-action.server";
import type { MessageBundle } from "@/core/i18n";
import type { ModuleManifest, ModuleServer } from "@/core/module";
import type { ViewData, ViewLoader, ViewLoaderContext } from "@/core/views";

import { BOOKING_SLOTS, type BookingSlotId } from "./guest-slots";

const servers: readonly ModuleServer[] = MODULE_SERVERS;
const manifests: readonly ModuleManifest[] = MODULES;

/** The loader of the module that fills `slot`, or undefined when no installed module does. */
export const slotLoaderOf = (all: readonly ModuleServer[], slot: BookingSlotId): ViewLoader | undefined =>
  all.find(({ slotLoaders }) => slotLoaders !== undefined && slot in slotLoaders)?.slotLoaders?.[slot];

/** What an unfilled slot answers: nothing, and nothing was asked. */
const EMPTY: ViewData = { state: { status: "empty" }, rows: [] };

/** Loads through the module that fills `slot`; an unfilled slot loads nothing and answers empty. */
export async function loadSlot(
  slot: BookingSlotId,
  context: ViewLoaderContext,
  params: unknown,
  all: readonly ModuleServer[] = servers,
): Promise<ViewData> {
  const loader = slotLoaderOf(all, slot);
  return loader === undefined ? EMPTY : loader(context, params);
}

/** The dictionary of the module that fills `slot`, for the screen to mount, or undefined when none does. */
export const slotBundleOf = (
  slot: BookingSlotId,
  all: readonly ModuleServer[] = servers,
): MessageBundle<unknown> | undefined =>
  all.find(({ slotBundles }) => slotBundles !== undefined && slot in slotBundles)?.slotBundles?.[slot];

/** The capability the filler of `slot` writes with, from its manifest's descriptor. Never a read (the generator checks). */
export const slotWriteOf = (slot: BookingSlotId): WriteCapabilityId | undefined =>
  manifests.flatMap(({ slots }) => slots ?? []).find((fill) => fill.slot === slot)?.write as
    | WriteCapabilityId
    | undefined;

/** The error texts of the module that fills `slot`, which a window that runs its write shows; none when no module does. */
export function slotErrorsOf(slot: BookingSlotId): ModuleServer["errors"] {
  const filler = manifests.find(({ slots }) => slots?.some((fill) => fill.slot === slot));
  return servers.find(({ id }) => id === filler?.id)?.errors;
}

/** Whether every slot the New reservation window needs has a filler: without one it cannot name a guest. */
export const reservationSlotsFilled = (all: readonly ModuleServer[] = servers): boolean =>
  slotLoaderOf(all, BOOKING_SLOTS.guests) !== undefined &&
  slotLoaderOf(all, BOOKING_SLOTS.guestSearch) !== undefined &&
  slotBundleOf(BOOKING_SLOTS.contactFields, all) !== undefined;
