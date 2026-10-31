"use client";

import { useOptimistic, useTransition } from "react";

import { Settings } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  currencyOptions,
  isLocale,
  LOCALE_NAMES,
  LOCALES,
  useCurrency,
  useLocale,
  useMessages,
} from "@/core/i18n/client";
import { isCurrency } from "@/core/money/client";
import { PREFERENCE_REGISTRY, THEME_PRESET_OPTIONS, usePreferencesStore } from "@/ds/preferences";
import { setCurrency, setLocale } from "@/ds/preferences/actions";
import { fontOptions } from "@/lib/fonts/registry";

import { shellMessageKey } from "./messages";
import { railButtonClassName } from "./rail-button";

export function LayoutControls() {
  const { preferences: text } = useMessages(shellMessageKey);
  const locale = useLocale();
  const [pendingLocale, setPendingLocale] = useOptimistic(locale);
  const currency = useCurrency();
  const [pendingCurrency, setPendingCurrency] = useOptimistic(currency);
  const [, startTransition] = useTransition();
  const { values, resolvedThemeMode, setPreference, resetPreferences } = usePreferencesStore(
    useShallow((state) => ({
      values: state.values,
      resolvedThemeMode: state.resolvedThemeMode,
      setPreference: state.setPreference,
      resetPreferences: state.resetPreferences,
    })),
  );

  const {
    theme_mode: themeMode,
    theme_preset: themePreset,
    content_layout: contentLayout,
    navbar_style: navbarStyle,
    font,
  } = values;

  const onThemePresetChange = (value: string) => {
    const preset = PREFERENCE_REGISTRY.theme_preset.values.find((preset) => preset === value);
    if (!preset) return;
    setPreference("theme_preset", preset);
  };

  const onThemeModeChange = (value: string) => {
    const mode = PREFERENCE_REGISTRY.theme_mode.values.find((mode) => mode === value);
    if (!mode) return;
    setPreference("theme_mode", mode);
  };

  const onContentLayoutChange = (value: string) => {
    const layout = PREFERENCE_REGISTRY.content_layout.values.find((layout) => layout === value);
    if (!layout) return;
    setPreference("content_layout", layout);
  };

  const onNavbarStyleChange = (value: string) => {
    const style = PREFERENCE_REGISTRY.navbar_style.values.find((style) => style === value);
    if (!style) return;
    setPreference("navbar_style", style);
  };

  const onFontChange = (value: string) => {
    const font = PREFERENCE_REGISTRY.font.values.find((font) => font === value);
    if (!font) return;
    setPreference("font", font);
  };

  const onLocaleChange = (value: string) => {
    if (!isLocale(value)) return;
    startTransition(async () => {
      setPendingLocale(value);
      try {
        await setLocale(value);
      } catch {
        // The optimistic value reverts when the transition ends; tell the owner why.
        toast.error(text.languageFailed);
      }
    });
  };

  const onCurrencyChange = (value: string) => {
    if (!isCurrency(value)) return;
    startTransition(async () => {
      setPendingCurrency(value);
      try {
        await setCurrency(value);
      } catch {
        toast.error(text.currencyFailed);
      }
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={railButtonClassName}>
          <Settings />
          <span className="sr-only">{text.trigger}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="end">
        <div className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <h4 className="text-sm leading-none font-medium">{text.title}</h4>
            <p className="text-muted-foreground text-xs">{text.description}</p>
          </div>
          <div className="space-y-3 **:data-[slot=toggle-group]:w-full **:data-[slot=toggle-group-item]:flex-1 **:data-[slot=toggle-group-item]:text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.themePreset}</Label>
              <Select value={themePreset} onValueChange={onThemePresetChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder={text.themePresetPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {THEME_PRESET_OPTIONS.map((preset) => (
                      <SelectItem key={preset.value} className="text-xs" value={preset.value}>
                        <span
                          className="size-2.5 rounded-full"
                          style={{
                            backgroundColor: resolvedThemeMode === "dark" ? preset.brand.dark : preset.brand.light,
                          }}
                        />
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.font}</Label>
              <Select value={font} onValueChange={onFontChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue placeholder={text.fontPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.key} className="text-xs" value={font.key}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.language}</Label>
              <Select value={pendingLocale} onValueChange={onLocaleChange}>
                <SelectTrigger size="sm" className="w-full text-xs" lang={pendingLocale}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {LOCALES.map((code) => (
                      <SelectItem key={code} className="text-xs" value={code} lang={code}>
                        {LOCALE_NAMES[code]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.currency}</Label>
              <Select value={pendingCurrency} onValueChange={onCurrencyChange}>
                <SelectTrigger size="sm" className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {currencyOptions(locale).map((option) => (
                      <SelectItem key={option.value} className="text-xs" value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.themeMode}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={themeMode}
                onValueChange={onThemeModeChange}
              >
                <ToggleGroupItem value="light">{text.modes.light}</ToggleGroupItem>
                <ToggleGroupItem value="dark">{text.modes.dark}</ToggleGroupItem>
                <ToggleGroupItem value="system">{text.modes.system}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.pageLayout}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={contentLayout}
                onValueChange={onContentLayoutChange}
              >
                <ToggleGroupItem value="centered">{text.layouts.centered}</ToggleGroupItem>
                <ToggleGroupItem value="full-width">{text.layouts.fullWidth}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium">{text.navbarBehavior}</Label>
              <ToggleGroup
                size="sm"
                spacing={0}
                variant="outline"
                type="single"
                value={navbarStyle}
                onValueChange={onNavbarStyleChange}
              >
                <ToggleGroupItem value="sticky">{text.navbarStyles.sticky}</ToggleGroupItem>
                <ToggleGroupItem value="scroll">{text.navbarStyles.scroll}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            {/* Deliberately leaves language and currency alone: their defaults come from Accept-Language, not the registry. */}
            <Button type="button" size="sm" variant="outline" className="w-full text-xs" onClick={resetPreferences}>
              {text.restoreDefaults}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
