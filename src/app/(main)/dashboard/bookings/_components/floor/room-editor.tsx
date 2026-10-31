"use client";

import { useEffect, useEffectEvent } from "react";

import { cn } from "cn";
import {
  Check,
  CopyPlus,
  Layers,
  LayoutGrid,
  MapPin,
  Plus,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  SquareDashed,
  Trash2,
  TriangleAlert,
  Undo2,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format, formatNumber, type Locale, useLocale, useMessages } from "@/core/i18n/client";

import { type BookingsMessages, bookingsMessageKey } from "../messages";
import type { DiningTable, FloorPlan, Landmark, LandmarkKind, Level, TableShape, Zone } from "./floor-model";
import { type PlanEdit, type PlanIssue, ROTATION_STEP_DEG, SNAP_CM } from "./plan-edits";
import { landmarkLabel, levelName, zoneName } from "./plan-names";
import { defaultSize } from "./table-geometry";

export type EditSelection = { kind: "table" | "landmark" | "zone"; id: string } | null;

const TABLE_PRESETS: { shape: TableShape; capacity: number }[] = [
  { shape: "round", capacity: 2 },
  { shape: "round", capacity: 4 },
  { shape: "square", capacity: 2 },
  { shape: "rect", capacity: 4 },
  { shape: "rect", capacity: 6 },
  { shape: "bar", capacity: 4 },
];

const LANDMARK_KINDS: readonly LandmarkKind[] = [
  "bar",
  "kitchen",
  "restrooms",
  "stairs",
  "entrance",
  "column",
  "plant",
  "label",
];

/** Columns and plants are drawn without a name. */
const UNNAMED_KINDS: readonly LandmarkKind[] = ["column", "plant"];

const SHAPES: readonly TableShape[] = ["round", "square", "rect", "bar"];

/** Fields, and open selects or menus, keep their own keys (arrows, Delete, brackets). */
function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.closest('[role="listbox"], [role="menu"]') !== null)
  );
}

/** Arrow keys nudge the selection by one grid step, ten with Shift: the keyboard alternative to dragging. */
const NUDGE: Record<string, { dx: number; dy: number }> = {
  ArrowLeft: { dx: -1, dy: 0 },
  ArrowRight: { dx: 1, dy: 0 },
  ArrowUp: { dx: 0, dy: -1 },
  ArrowDown: { dx: 0, dy: 1 },
};

/** Top bar of the room editor: add tables, landmarks, zones and levels; undo; leave edit mode. */
export function RoomEditorToolbar({
  level,
  nextLevelNumber,
  targetZoneId,
  selection,
  onEdit,
  onSelect,
  canUndo,
  onUndo,
  onReset,
  onDone,
  onOpenPanel,
}: {
  level: Level;
  /** The number a new level gets in its default name. */
  nextLevelNumber: number;
  targetZoneId: string | null;
  selection: EditSelection;
  onEdit: (edit: PlanEdit) => void;
  onSelect: (selection: EditSelection) => void;
  canUndo: boolean;
  onUndo: () => void;
  onReset: () => void;
  onDone: () => void;
  /** Phones: opens the properties drawer with nothing selected (level and zones). */
  onOpenPanel?: () => void;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const targetZone = level.zones.find((zone) => zone.id === targetZoneId);
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (isTyping(event.target)) return;
    const command = event.metaKey || event.ctrlKey;
    if (command && event.key.toLowerCase() === "z") {
      event.preventDefault();
      onUndo();
      return;
    }
    // Escape peels the selection first; an open menu or popover that already handled it wins.
    if (event.key === "Escape" && selection && !event.defaultPrevented) {
      event.preventDefault();
      onSelect(null);
      return;
    }
    if (!selection || selection.kind === "zone") return;
    const isTable = selection.kind === "table";
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      onEdit(
        isTable ? { type: "removeTable", tableId: selection.id } : { type: "removeLandmark", landmarkId: selection.id },
      );
      onSelect(null);
    } else if (command && event.key.toLowerCase() === "d" && isTable) {
      event.preventDefault();
      onEdit({ type: "duplicateTable", tableId: selection.id });
    } else if (NUDGE[event.key]) {
      const { dx, dy } = NUDGE[event.key];
      const element = isTable
        ? level.zones.flatMap((zone) => zone.tables).find((table) => table.id === selection.id)
        : level.landmarks.find((landmark) => landmark.id === selection.id);
      if (!element) return;
      event.preventDefault();
      const step = event.shiftKey ? SNAP_CM * 10 : SNAP_CM;
      const xCm = element.xCm + dx * step;
      const yCm = element.yCm + dy * step;
      onEdit(
        isTable
          ? { type: "moveTable", tableId: selection.id, xCm, yCm }
          : { type: "moveLandmark", landmarkId: selection.id, xCm, yCm },
      );
    } else if (event.key === "[" || event.key === "]") {
      event.preventDefault();
      onEdit({
        type: "rotateElement",
        kind: selection.kind,
        id: selection.id,
        byDeg: event.key === "]" ? ROTATION_STEP_DEG : -ROTATION_STEP_DEG,
      });
    }
  });

  useEffect(() => {
    // On document, so it runs before the full-view frame's window listener and Escape clears the selection first.
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="liquid-glass liquid-glass-solid text-foreground flex flex-wrap items-center justify-center gap-1.5 rounded-2xl p-1.5">
      <Badge className="mx-1 h-auto max-w-full whitespace-normal">
        {format(text.editor.editing, locale, { level: levelName(level, text.venue) })}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={!targetZoneId}
            className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
          >
            <Plus data-icon="inline-start" />
            {text.editor.addTable}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel className="text-muted-foreground text-xs">
            {targetZone ? format(text.editor.intoZone, locale, { zone: zoneName(targetZone, text.venue) }) : null}
          </DropdownMenuLabel>
          {TABLE_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={`${preset.shape}-${preset.capacity}`}
              onSelect={() => targetZoneId && onEdit({ type: "addTable", zoneId: targetZoneId, ...preset })}
            >
              {format(text.editor.preset, locale, {
                shape: text.editor.shapes[preset.shape],
                count: preset.capacity,
              })}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground">
            <MapPin data-icon="inline-start" />
            {text.editor.addElement}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {LANDMARK_KINDS.map((kind) => (
            <DropdownMenuItem
              key={kind}
              onSelect={() =>
                onEdit({
                  type: "addLandmark",
                  levelId: level.id,
                  kind,
                  label: UNNAMED_KINDS.includes(kind) ? "" : text.editor.kinds[kind],
                })
              }
            >
              {text.editor.kinds[kind]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
        onClick={() =>
          onEdit({
            type: "addZone",
            levelId: level.id,
            name: format(text.editor.newZone, locale, { number: level.zones.length + 1 }),
          })
        }
      >
        <SquareDashed data-icon="inline-start" />
        {text.editor.addZone}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
        onClick={() =>
          onEdit({ type: "addLevel", name: format(text.editor.newLevel, locale, { number: nextLevelNumber }) })
        }
      >
        <Layers data-icon="inline-start" />
        {text.editor.addLevel}
      </Button>
      {onOpenPanel && (
        <Button
          variant="ghost"
          size="icon"
          aria-label={text.editor.panel}
          className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground size-8"
          onClick={onOpenPanel}
        >
          <SlidersHorizontal />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label={text.editor.undo}
        disabled={!canUndo}
        className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground size-8"
        onClick={onUndo}
      >
        <Undo2 />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={text.editor.more}
            className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground size-8"
          >
            <LayoutGrid />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onSelect={onReset}>
            {text.editor.reset}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" className="liquid-glass-brand rounded-full px-3" onClick={onDone}>
        <Check data-icon="inline-start" />
        {text.editor.done}
      </Button>
    </div>
  );
}

/** Text or number input that commits on blur or Enter, so one undo step equals one finished change. */
function CommitField({
  id,
  label,
  value,
  type = "text",
  step,
  min,
  onCommit,
}: {
  id: string;
  label: string;
  value: string | number;
  type?: "text" | "number";
  step?: number;
  min?: number;
  onCommit: (value: string) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        key={String(value)}
        id={id}
        type={type}
        step={step}
        min={min}
        defaultValue={value}
        onBlur={(event) => {
          const raw = event.target.value;
          // Show the stored value again; a commit that changes it remounts the field with the new one.
          event.target.value = String(value);
          if (raw !== String(value)) onCommit(raw);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
      />
    </Field>
  );
}

function RotationField({ value, onChange }: { value: number; onChange: (degrees: number) => void }) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  return (
    <Field>
      <FieldLabel>{text.editor.fields.rotation}</FieldLabel>
      <ButtonGroup>
        <Button
          variant="outline"
          size="icon"
          aria-label={format(text.editor.fields.rotateLeft, locale, { degrees: ROTATION_STEP_DEG })}
          onClick={() => onChange(value - ROTATION_STEP_DEG)}
        >
          <RotateCcw />
        </Button>
        <ButtonGroupText className="min-w-14 justify-center tabular-nums">
          {formatNumber(((value % 360) + 360) % 360, locale, { style: "unit", unit: "degree", unitDisplay: "narrow" })}
        </ButtonGroupText>
        <Button
          variant="outline"
          size="icon"
          aria-label={format(text.editor.fields.rotateRight, locale, { degrees: ROTATION_STEP_DEG })}
          onClick={() => onChange(value + ROTATION_STEP_DEG)}
        >
          <RotateCw />
        </Button>
      </ButtonGroup>
    </Field>
  );
}

/** Whole centimetres from a field; an empty or invalid entry keeps the current value. */
const toNumber = (value: string, fallback: number) => {
  const parsed = value.trim() === "" ? Number.NaN : Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
};

/** Centre of an element in plan centimetres: the single-pointer alternative to dragging it. */
function PositionFields({
  idPrefix,
  xCm,
  yCm,
  onMove,
}: {
  idPrefix: string;
  xCm: number;
  yCm: number;
  onMove: (xCm: number, yCm: number) => void;
}) {
  const text = useMessages(bookingsMessageKey);
  return (
    <div className="grid grid-cols-2 gap-2">
      <CommitField
        id={`${idPrefix}-x`}
        label={text.editor.fields.x}
        type="number"
        step={SNAP_CM}
        value={xCm}
        onCommit={(raw) => onMove(toNumber(raw, xCm), yCm)}
      />
      <CommitField
        id={`${idPrefix}-y`}
        label={text.editor.fields.y}
        type="number"
        step={SNAP_CM}
        value={yCm}
        onCommit={(raw) => onMove(xCm, toNumber(raw, yCm))}
      />
    </div>
  );
}

/** Smallest zone side, so a zone never collapses to nothing. */
const ZONE_MIN_CM = 100;

/** Panel heading: the selected element, else the level being edited. */
function panelTitle({
  table,
  landmark,
  zone,
  level,
  text,
  locale,
}: {
  table?: DiningTable;
  landmark?: Landmark;
  zone?: Zone;
  level: Level;
  text: BookingsMessages;
  locale: Locale;
}) {
  if (table) return format(text.editor.tableTitle, locale, { label: table.label });
  if (landmark) return landmarkLabel(landmark, text.venue) || text.editor.kinds[landmark.kind];
  return zone ? zoneName(zone, text.venue) : levelName(level, text.venue);
}

/** Properties of the selected table, landmark or zone; with nothing selected, the level and its zones. */
export function RoomEditorPanel({
  plan,
  level,
  selection,
  issues,
  onEdit,
  onSelect,
  className,
}: {
  plan: FloorPlan;
  level: Level;
  selection: EditSelection;
  issues: readonly PlanIssue[];
  onEdit: (edit: PlanEdit) => void;
  onSelect: (selection: EditSelection) => void;
  className?: string;
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const fields = text.editor.fields;
  const zone = level.zones.find((item) =>
    selection?.kind === "zone" ? item.id === selection.id : item.tables.some((table) => table.id === selection?.id),
  );
  const table = selection?.kind === "table" ? zone?.tables.find((item) => item.id === selection.id) : undefined;
  const landmark =
    selection?.kind === "landmark" ? level.landmarks.find((item) => item.id === selection.id) : undefined;
  const title = panelTitle({
    table,
    landmark,
    zone: selection?.kind === "zone" ? zone : undefined,
    level,
    text,
    locale,
  });
  const levelIssues = issues.filter((issue) =>
    level.zones.some((item) => item.tables.some((t) => t.id === issue.elementId)),
  );

  return (
    <Card size="sm" className={cn("gap-0 overflow-hidden py-0", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="min-w-0 text-sm font-medium break-words">{title}</span>
        {selection && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={text.editor.clearSelection}
            className="size-7"
            onClick={() => onSelect(null)}
          >
            <X />
          </Button>
        )}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-3">
          {table && (
            <FieldGroup className="gap-3">
              <CommitField
                id="table-label"
                label={fields.label}
                value={table.label}
                onCommit={(label) => onEdit({ type: "updateTable", tableId: table.id, change: { label } })}
              />
              <Field>
                <FieldLabel htmlFor="table-shape">{fields.shape}</FieldLabel>
                <Select
                  value={table.shape}
                  onValueChange={(value) => {
                    const shape = SHAPES.find((item) => item === value);
                    if (shape)
                      onEdit({
                        type: "updateTable",
                        tableId: table.id,
                        change: { shape, ...defaultSize(table.capacity, shape) },
                      });
                  }}
                >
                  <SelectTrigger id="table-shape" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SHAPES.map((shape) => (
                        <SelectItem key={shape} value={shape}>
                          {text.editor.shapes[shape]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <CommitField
                id="table-seats"
                label={fields.seats}
                type="number"
                min={1}
                value={table.capacity}
                onCommit={(raw) => {
                  const capacity = Math.max(1, Math.round(toNumber(raw, table.capacity)));
                  onEdit({
                    type: "updateTable",
                    tableId: table.id,
                    change: { capacity, ...defaultSize(capacity, table.shape) },
                  });
                }}
              />
              <PositionFields
                idPrefix="table"
                xCm={table.xCm}
                yCm={table.yCm}
                onMove={(xCm, yCm) => onEdit({ type: "moveTable", tableId: table.id, xCm, yCm })}
              />
              <div className="grid grid-cols-2 gap-2">
                <CommitField
                  id="table-width"
                  label={fields.width}
                  type="number"
                  step={10}
                  min={40}
                  value={table.widthCm}
                  onCommit={(raw) =>
                    onEdit({
                      type: "updateTable",
                      tableId: table.id,
                      change: { widthCm: Math.max(40, toNumber(raw, table.widthCm)) },
                    })
                  }
                />
                <CommitField
                  id="table-depth"
                  label={fields.depth}
                  type="number"
                  step={10}
                  min={40}
                  value={table.depthCm}
                  onCommit={(raw) =>
                    onEdit({
                      type: "updateTable",
                      tableId: table.id,
                      change: { depthCm: Math.max(40, toNumber(raw, table.depthCm)) },
                    })
                  }
                />
              </div>
              <RotationField
                value={table.rotationDeg}
                onChange={(rotationDeg) => onEdit({ type: "updateTable", tableId: table.id, change: { rotationDeg } })}
              />
              <Field orientation="horizontal">
                <FieldLabel htmlFor="table-in-service">{fields.inService}</FieldLabel>
                <Switch
                  id="table-in-service"
                  checked={table.inService}
                  onCheckedChange={(inService) =>
                    onEdit({ type: "updateTable", tableId: table.id, change: { inService } })
                  }
                />
              </Field>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit({ type: "duplicateTable", tableId: table.id })}
                >
                  <CopyPlus data-icon="inline-start" />
                  {fields.duplicate}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onEdit({ type: "removeTable", tableId: table.id });
                    onSelect(null);
                  }}
                >
                  <Trash2 data-icon="inline-start" />
                  {fields.delete}
                </Button>
              </div>
            </FieldGroup>
          )}

          {landmark && (
            <FieldGroup className="gap-3">
              <CommitField
                id="landmark-label"
                label={fields.label}
                value={landmarkLabel(landmark, text.venue)}
                onCommit={(label) => onEdit({ type: "updateLandmark", landmarkId: landmark.id, change: { label } })}
              />
              <PositionFields
                idPrefix="landmark"
                xCm={landmark.xCm}
                yCm={landmark.yCm}
                onMove={(xCm, yCm) => onEdit({ type: "moveLandmark", landmarkId: landmark.id, xCm, yCm })}
              />
              <div className="grid grid-cols-2 gap-2">
                <CommitField
                  id="landmark-width"
                  label={fields.width}
                  type="number"
                  step={10}
                  min={20}
                  value={landmark.widthCm}
                  onCommit={(raw) =>
                    onEdit({
                      type: "updateLandmark",
                      landmarkId: landmark.id,
                      change: { widthCm: Math.max(20, toNumber(raw, landmark.widthCm)) },
                    })
                  }
                />
                <CommitField
                  id="landmark-depth"
                  label={fields.depth}
                  type="number"
                  step={10}
                  min={20}
                  value={landmark.depthCm}
                  onCommit={(raw) =>
                    onEdit({
                      type: "updateLandmark",
                      landmarkId: landmark.id,
                      change: { depthCm: Math.max(20, toNumber(raw, landmark.depthCm)) },
                    })
                  }
                />
              </div>
              <RotationField
                value={landmark.rotationDeg}
                onChange={(rotationDeg) =>
                  onEdit({ type: "updateLandmark", landmarkId: landmark.id, change: { rotationDeg } })
                }
              />
              {landmark.kind === "stairs" && (
                <Field>
                  <FieldLabel htmlFor="landmark-link">{fields.leadsTo}</FieldLabel>
                  <Select
                    value={landmark.toLevelId ?? ""}
                    onValueChange={(toLevelId) =>
                      onEdit({ type: "updateLandmark", landmarkId: landmark.id, change: { toLevelId } })
                    }
                  >
                    <SelectTrigger id="landmark-link" className="w-full">
                      <SelectValue placeholder={fields.chooseLevel} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {plan.levels
                          .filter((item) => item.id !== level.id)
                          .map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {levelName(item, text.venue)}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onEdit({ type: "removeLandmark", landmarkId: landmark.id });
                  onSelect(null);
                }}
              >
                <Trash2 data-icon="inline-start" />
                {fields.delete}
              </Button>
            </FieldGroup>
          )}

          {selection?.kind === "zone" && zone && (
            <FieldGroup className="gap-3">
              <CommitField
                id="zone-name"
                label={fields.name}
                value={zoneName(zone, text.venue)}
                onCommit={(name) => onEdit({ type: "updateZone", zoneId: zone.id, change: { name } })}
              />
              <Field orientation="horizontal">
                <FieldLabel htmlFor="zone-outdoor">{fields.outdoor}</FieldLabel>
                <Switch
                  id="zone-outdoor"
                  checked={zone.outdoor}
                  onCheckedChange={(outdoor) => onEdit({ type: "updateZone", zoneId: zone.id, change: { outdoor } })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                {(["xCm", "yCm", "widthCm", "depthCm"] as const).map((key) => (
                  <CommitField
                    key={key}
                    id={`zone-${key}`}
                    label={{ xCm: fields.x, yCm: fields.y, widthCm: fields.width, depthCm: fields.depth }[key]}
                    type="number"
                    step={10}
                    min={key === "widthCm" || key === "depthCm" ? ZONE_MIN_CM : undefined}
                    value={zone.outline[key]}
                    onCommit={(raw) => {
                      const value = toNumber(raw, zone.outline[key]);
                      const size = key === "widthCm" || key === "depthCm";
                      onEdit({
                        type: "updateZone",
                        zoneId: zone.id,
                        change: { outline: { ...zone.outline, [key]: size ? Math.max(ZONE_MIN_CM, value) : value } },
                      });
                    }}
                  />
                ))}
              </div>
              <CommitField
                id="zone-walls"
                label={fields.wallHeight}
                type="number"
                step={10}
                min={0}
                value={zone.wallHeightCm}
                onCommit={(raw) =>
                  onEdit({
                    type: "updateZone",
                    zoneId: zone.id,
                    change: { wallHeightCm: Math.max(0, toNumber(raw, zone.wallHeightCm)) },
                  })
                }
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onEdit({ type: "removeZone", zoneId: zone.id });
                  onSelect(null);
                }}
              >
                <Trash2 data-icon="inline-start" />
                {fields.deleteZone}
              </Button>
            </FieldGroup>
          )}

          {!selection && (
            <FieldGroup className="gap-3">
              <CommitField
                id="level-name"
                label={fields.levelName}
                value={levelName(level, text.venue)}
                onCommit={(name) => onEdit({ type: "renameLevel", levelId: level.id, name })}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground text-xs">{fields.zones}</span>
                <ItemGroup className="gap-1">
                  {level.zones.map((item) => (
                    <Item key={item.id} asChild size="xs" variant="outline">
                      <button type="button" onClick={() => onSelect({ kind: "zone", id: item.id })}>
                        <ItemContent>
                          <ItemTitle
                            className="line-clamp-2 block w-full font-normal break-words hyphens-auto"
                            title={zoneName(item, text.venue)}
                          >
                            {zoneName(item, text.venue)}
                          </ItemTitle>
                          <ItemDescription className="text-[11px]">
                            {format(fields.zoneSummary, locale, {
                              tables: format(fields.tablesCount, locale, { count: item.tables.length }),
                              kind: item.outdoor ? fields.outdoorKind : fields.indoorKind,
                            })}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions className="text-muted-foreground shrink-0 self-start text-xs">
                          {fields.editZone}
                        </ItemActions>
                      </button>
                    </Item>
                  ))}
                </ItemGroup>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={level.zones.length > 0 || level.landmarks.length > 0 || plan.levels.length === 1}
                onClick={() => onEdit({ type: "removeLevel", levelId: level.id })}
              >
                <Trash2 data-icon="inline-start" />
                {fields.removeLevel}
              </Button>
              <p className="text-muted-foreground text-xs">{fields.hint}</p>
            </FieldGroup>
          )}

          {levelIssues.length > 0 && (
            <ul className="flex flex-col gap-1" aria-label={text.editor.warnings.label}>
              {levelIssues.map((issue) => {
                const message =
                  issue.kind === "outside"
                    ? format(text.editor.warnings.outside, locale, {
                        table: issue.tableLabel,
                        zone: zoneName(issue.zone, text.venue),
                      })
                    : format(text.editor.warnings.overlap, locale, {
                        table: issue.tableLabel,
                        other: issue.otherLabel,
                      });
                return (
                  <li key={message} className="text-muted-foreground flex items-start gap-1.5 text-xs">
                    <TriangleAlert className="text-salmon mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">{message}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
