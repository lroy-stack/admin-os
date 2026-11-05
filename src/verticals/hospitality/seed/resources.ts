import type { Area, Resource } from "@/modules/resources";

export const areas: Area[] = [
  { id: "dining", label: "Dining room", levelId: "street", ext: { outdoor: false } },
  { id: "bar", label: "Bar", levelId: "street", ext: { outdoor: false } },
  { id: "terrace", label: "Terrace", levelId: "rooftop", ext: { outdoor: true } },
];

export const table = (id: string, areaId: string, shape: "rect" | "square" | "round", capacity: number): Resource => ({
  id,
  kind: "table",
  label: id,
  areaId,
  capacity,
  active: true,
  ext: { shape },
});

export const resources: Resource[] = [
  table("S1", "dining", "rect", 4),
  table("S2", "dining", "square", 2),
  table("S3", "dining", "rect", 4),
  table("S4", "dining", "square", 2),
  table("S5", "dining", "round", 4),
  table("S6", "dining", "rect", 6),
  table("S7", "dining", "rect", 4),
  table("S8", "dining", "round", 2),
  table("B1", "bar", "round", 2),
  table("B2", "bar", "round", 2),
  table("B3", "bar", "round", 2),
  table("B4", "bar", "round", 2),
  table("T1", "terrace", "square", 2),
  table("T2", "terrace", "square", 2),
  table("T3", "terrace", "rect", 4),
  table("T4", "terrace", "square", 2),
  table("T5", "terrace", "rect", 4),
  table("T6", "terrace", "rect", 4),
  table("T7", "terrace", "round", 3),
  table("T8", "terrace", "square", 2),
];
