// Public entry of the preferences runtime: only what consumers outside the package use, so the future
// `packages/ui/preferences` contract stays narrow. Server Actions live in "./actions" and are a separate entry
// (@/ds/preferences/actions): a "use server" module must not be re-exported from this client-facing barrel.
export {
  PREFERENCE_DEFAULTS,
  PREFERENCE_REGISTRY,
  type PreferenceKey,
  type PreferenceValueMap,
} from "./preferences-config";
export { PreferencesStoreProvider, usePreferencesStore } from "./preferences-provider";
export { THEME_PRESET_OPTIONS } from "./theme";
export { ThemeBootScript } from "./theme-boot";
