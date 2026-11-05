import type { Area, Resource } from "@/modules/resources";

export const areas: Area[] = [{ id: "floor", label: "Salon floor" }];

export const chair = (id: string): Resource => ({ id, kind: "chair", label: id, areaId: "floor", active: true });

export const resources: Resource[] = [chair("chair-1"), chair("chair-2"), chair("chair-3")];
