import type { OpenStage } from "@/data/crm";
import type { Tone } from "@/ds/components";

/** Pipeline stages read left to right as azure → accent → salmon → neutral. */
export const stageTones: Record<OpenStage, Tone> = {
  qualification: "azure",
  proposal: "brand",
  negotiation: "salmon",
  closing: "neutral",
};
