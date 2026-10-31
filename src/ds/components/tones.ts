/** The dashboard's series palette; every status, stage or segment colour maps to one of these tones. */
export type Tone = "azure" | "brand" | "salmon" | "neutral";

/** Translucent fill for tiles, pills and timeline bars. */
export const toneTint: Record<Tone, string> = {
  azure: "bg-azure/30",
  brand: "bg-brand/30",
  salmon: "bg-salmon/30",
  neutral: "bg-foreground/20",
};

/** Faint wash for large surfaces such as board columns. */
export const toneWash: Record<Tone, string> = {
  azure: "bg-azure/8",
  brand: "bg-brand/8",
  salmon: "bg-salmon/8",
  neutral: "bg-foreground/5",
};

/** Solid swatch for dots, legends and bar segments. */
export const toneSolid: Record<Tone, string> = {
  azure: "bg-azure",
  brand: "bg-brand",
  salmon: "bg-salmon",
  neutral: "bg-foreground/60",
};

/** Accent edge for bars that sit on a tinted fill. */
export const toneEdge: Record<Tone, string> = {
  azure: "border-azure",
  brand: "border-brand",
  salmon: "border-salmon",
  neutral: "border-foreground/50",
};
