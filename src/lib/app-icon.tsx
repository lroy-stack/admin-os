import { ImageResponse } from "next/og";

import { AppLogo } from "@/components/app-logo";

// The Lime brand pair of the shell's logo badge (dark mode `--brand` and `--brand-foreground`) in sRGB, since the
// icon renderer does not read CSS variables or oklch.
const BRAND = "#d4f36b";
const BRAND_FOREGROUND = "#151909";

/**
 * The app icon: the logo on the lime badge. Browser icons get the badge's rounded corners; the Apple touch icon stays
 * square because iOS applies its own mask.
 */
export function createAppIcon(size: number, { rounded = true }: { rounded?: boolean } = {}) {
  const logoSize = size * 0.62;

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: BRAND,
        color: BRAND_FOREGROUND,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
    >
      <AppLogo width={logoSize} height={logoSize} />
    </div>,
    { width: size, height: size },
  );
}
