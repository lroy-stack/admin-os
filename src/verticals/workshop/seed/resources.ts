import type { Area, Resource } from "@/modules/resources";

export const areas: Area[] = [{ id: "shop", label: "Shop floor" }];

export const resources: Resource[] = [{ id: "bay-1", kind: "bay", label: "Bay 1", areaId: "shop", active: true }];
