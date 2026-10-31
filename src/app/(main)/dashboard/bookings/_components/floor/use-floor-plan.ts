"use client";

import { useEffect, useState } from "react";

import { z } from "zod";

import type { FloorPlan } from "./floor-model";
import { applyEdit, type PlanEdit } from "./plan-edits";

const STORAGE_KEY = "bookings.floor-plan.v1";
const MAX_UNDO = 50;

const tableSchema = z.object({
  id: z.string(),
  label: z.string(),
  shape: z.enum(["rect", "square", "round", "bar"]),
  xCm: z.number(),
  yCm: z.number(),
  widthCm: z.number().positive(),
  depthCm: z.number().positive(),
  rotationDeg: z.number(),
  capacity: z.number().int().positive(),
  inService: z.boolean(),
});

const zoneSchema = z.object({
  id: z.string(),
  name: z.string(),
  outdoor: z.boolean(),
  outline: z.object({
    xCm: z.number(),
    yCm: z.number(),
    widthCm: z.number().positive(),
    depthCm: z.number().positive(),
  }),
  wallHeightCm: z.number().nonnegative(),
  openings: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["door", "window"]),
      edge: z.enum(["n", "e", "s", "w"]),
      offsetCm: z.number(),
      widthCm: z.number().positive(),
    }),
  ),
  tables: z.array(tableSchema),
});

const landmarkSchema = z.object({
  id: z.string(),
  kind: z.enum(["bar", "kitchen", "restrooms", "stairs", "entrance", "column", "plant", "label"]),
  label: z.string(),
  xCm: z.number(),
  yCm: z.number(),
  widthCm: z.number().positive(),
  depthCm: z.number().positive(),
  rotationDeg: z.number(),
  toLevelId: z.string().optional(),
});

export const floorPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  levels: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        index: z.number().int(),
        zones: z.array(zoneSchema),
        landmarks: z.array(landmarkSchema),
      }),
    )
    .min(1),
});

/** Reads a saved plan; anything missing or malformed falls back to the default plan, with a warning. */
function readSaved(): FloorPlan | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = floorPlanSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
    console.warn("Saved room plan is invalid; using the default room.", parsed.error.issues);
    return null;
  } catch (error) {
    console.warn("Saved room plan could not be read; using the default room.", error);
    return null;
  }
}

/**
 * The editable room plan with undo. Edits persist in this browser only (mock data, no backend), so the plan
 * survives reloads while the server always renders the default.
 */
export function useFloorPlan(defaultPlan: FloorPlan) {
  const [plan, setPlan] = useState(defaultPlan);
  const [history, setHistory] = useState<FloorPlan[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = readSaved();
    if (saved) setPlan(saved);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // Never store a plan the next load would reject; the edit stays on screen and the last valid plan stays saved.
    const valid = floorPlanSchema.safeParse(plan);
    if (!valid.success) {
      console.warn("Room plan not saved: it does not match the plan schema.", valid.error.issues);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
    } catch {
      // Storage can be full or blocked (private mode); the plan still works for this session.
    }
  }, [plan, loaded]);

  function edit(change: PlanEdit) {
    setHistory((past) => [...past, plan].slice(-MAX_UNDO));
    setPlan(applyEdit(plan, change));
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setHistory((past) => past.slice(0, -1));
    setPlan(previous);
  }

  function reset() {
    setHistory((past) => [...past, plan].slice(-MAX_UNDO));
    setPlan(defaultPlan);
  }

  return { plan, edit, undo, canUndo: history.length > 0, reset };
}
