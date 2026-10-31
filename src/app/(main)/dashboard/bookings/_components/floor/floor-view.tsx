"use client";

import { type ReactNode, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { cn } from "cn";
import { Maximize, Minus, Plus, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SegmentedControl, type SegmentedOption } from "@/ds/components";

import { type ViewMode, ZOOM_BUTTON_STEP } from "./camera-math";
import { type DiningTable, type FloorPlan, type Level, levelsTopDown } from "./floor-model";
import { FloorScene, type SceneMode, type SceneMove } from "./floor-scene";
import { readRoomPalette, watchRoomPalette } from "./room-colors";
import { tableStateCues } from "./state-cues";
import { type TableReading, tableStateLabels, type VisibleTableState } from "./table-state";

const viewOptions: SegmentedOption<ViewMode>[] = [
  { value: "2d", label: "2D" },
  { value: "2.5d", label: "2.5D" },
  { value: "3d", label: "3D" },
];

/** Below this many pixels per metre plates show only the table number. */
const DETAIL_SCALE_PX_PER_M = 46;

const stateSwatch: Record<VisibleTableState, string> = {
  free: "bg-(--table-free) ring-1 ring-foreground/40",
  arriving: "bg-(--table-arriving)",
  seated: "bg-(--table-seated)",
  leaving: "bg-(--table-leaving)",
  late: "bg-(--table-late)",
  blocked: "bg-(--table-blocked)",
};

const LEGEND_ORDER: VisibleTableState[] = ["seated", "arriving", "leaving", "late", "free", "blocked"];

/** The plate glyph of a state, repeated in the legend so the glyph is learnt from it. */
function LegendIcon({ state }: { state: VisibleTableState }) {
  const Icon = tableStateCues[state].icon;
  return Icon ? <Icon aria-hidden="true" className="text-foreground/70 size-3" /> : null;
}

export type FloorViewProps = {
  plan: FloorPlan;
  levelId: string;
  onLevelChange: (levelId: string) => void;
  readings: ReadonlyMap<string, TableReading>;
  describe: (tableId: string) => string;
  selectedTableId: string | null;
  candidateTableIds: ReadonlySet<string>;
  onTableSelect: (tableId: string | null) => void;
  /** Content of the anchored callout for the selected table; null keeps it closed (phones use a drawer instead). */
  callout: ReactNode;
  banner?: ReactNode;
  mode?: SceneMode;
  onMove?: (move: SceneMove) => void;
  selectedLandmarkId?: string | null;
  onLandmarkSelect?: (landmarkId: string | null) => void;
  className?: string;
};

/** In the editor tables only show whether they take bookings. */
function editingState(table: DiningTable): VisibleTableState {
  return table.inService ? "free" : "blocked";
}

function levelOccupancy(level: Level, readings: ReadonlyMap<string, TableReading>) {
  const tables = level.zones.flatMap((zone) => zone.tables);
  const seats = tables.reduce((total, table) => total + table.capacity, 0);
  const seated = tables.reduce((total, table) => {
    const reading = readings.get(table.id);
    const busy = reading?.state === "seated" || reading?.state === "leaving";
    return busy && reading?.reservation ? total + reading.reservation.partySize : total;
  }, 0);
  return `${seated}/${seats}`;
}

/** The interactive room: a three.js scene with DOM plates, camera controls, level switcher and anchored callout. */
export function FloorView({
  plan,
  levelId,
  onLevelChange,
  readings,
  describe,
  selectedTableId,
  candidateTableIds,
  onTableSelect,
  callout,
  banner,
  mode = "service",
  onMove,
  selectedLandmarkId = null,
  onLandmarkSelect,
  className,
}: FloorViewProps) {
  const editing = mode === "edit";
  const hostRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FloorScene | null>(null);
  const plateRefs = useRef(new Map<string, HTMLElement>());
  // Table whose plate opened the callout from the keyboard: focus moves into the callout and back on close.
  const keyboardPlateRef = useRef<string | null>(null);
  const [view, setView] = useState<ViewMode>("2.5d");

  const level = plan.levels.find((item) => item.id === levelId) ?? plan.levels[0];
  const tables = useMemo(() => level?.zones.flatMap((zone) => zone.tables) ?? [], [level]);
  const landmarks = level?.landmarks ?? [];

  const levelOptions: SegmentedOption<string>[] = levelsTopDown(plan).map((item) => ({
    value: item.id,
    label: `${item.name} ${levelOccupancy(item, readings)}`,
  }));

  const handlePick = useEffectEvent((pick: { kind: string; id?: string }) => {
    if (editing) {
      onTableSelect(pick.kind === "table" && pick.id ? pick.id : null);
      onLandmarkSelect?.(pick.kind === "landmark" && pick.id ? pick.id : null);
      return;
    }
    if (pick.kind === "table" && pick.id) onTableSelect(pick.id);
    else if (pick.kind === "landmark" && pick.id) {
      const target = landmarks.find((landmark) => landmark.id === pick.id)?.toLevelId;
      if (target) onLevelChange(target);
    } else onTableSelect(null);
  });

  const handleMove = useEffectEvent((move: SceneMove) => onMove?.(move));

  // Plates and the callout anchor follow their tables every rendered frame, without React re-renders.
  const syncOverlay = useEffectEvent(() => {
    const engine = engineRef.current;
    if (!engine || !level) return;
    const detailed = engine.getScale() >= DETAIL_SCALE_PX_PER_M;
    layerRef.current?.setAttribute("data-detail", String(detailed));
    for (const table of tables) {
      const plate = plateRefs.current.get(table.id);
      if (!plate) continue;
      const position = engine.positionOf(table.id) ?? table;
      const point = engine.project(position.xCm, position.yCm, 0.95);
      plate.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -100%)`;
    }
    for (const landmark of landmarks) {
      const plate = plateRefs.current.get(`landmark:${landmark.id}`);
      if (!plate) continue;
      const position = engine.positionOf(landmark.id) ?? landmark;
      const point = engine.project(position.xCm, position.yCm, 1.2);
      plate.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
    }
    const selected = tables.find((table) => table.id === selectedTableId);
    if (selected && anchorRef.current) {
      const position = engine.positionOf(selected.id) ?? selected;
      const point = engine.project(position.xCm, position.yCm, 0.75);
      anchorRef.current.style.transform = `translate(${point.x}px, ${point.y}px)`;
    }
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const engine = new FloorScene(host, {
      onPick: (pick) => handlePick(pick),
      onMove: (move) => handleMove(move),
      onFrame: () => syncOverlay(),
    });
    engineRef.current = engine;
    const stopWatching = watchRoomPalette(
      document.documentElement,
      () => readRoomPalette(host),
      (palette) => engine.setPalette(palette),
    );
    return () => {
      stopWatching();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setMode(mode);
    if (mode === "edit") {
      // Precise placement reads best from straight above.
      setView("2d");
      engineRef.current?.setView("2d");
    }
  }, [mode]);

  useEffect(() => {
    if (level) engineRef.current?.setLevel(level);
  }, [level]);

  useEffect(() => {
    engineRef.current?.setTableVisuals(
      tables.map((table) => ({
        id: table.id,
        state: editing ? editingState(table) : (readings.get(table.id)?.state ?? "free"),
        selected: table.id === selectedTableId,
        dimmed:
          !editing && selectedTableId !== null && table.id !== selectedTableId && !candidateTableIds.has(table.id),
        candidate: !editing && candidateTableIds.has(table.id),
      })),
    );
  }, [tables, readings, selectedTableId, candidateTableIds, editing]);

  useEffect(() => {
    const engine = engineRef.current;
    // While editing the camera stays where the editor put it.
    if (!engine || editing) return;
    if (selectedTableId && tables.some((table) => table.id === selectedTableId)) engine.focusTable(selectedTableId);
    else engine.fit();
  }, [selectedTableId, tables, editing]);

  function changeView(next: ViewMode) {
    setView(next);
    engineRef.current?.setView(next);
    if (selectedTableId) {
      // Re-centre on the selection once the new angles have framed the room.
      window.setTimeout(() => engineRef.current?.focusTable(selectedTableId), 300);
    }
  }

  const counts = LEGEND_ORDER.map((state) => ({
    state,
    count: tables.filter((table) => (readings.get(table.id)?.state ?? "free") === state).length,
  })).filter((entry) => !editing && entry.count > 0);

  return (
    <div data-room className={cn("relative isolate overflow-hidden rounded-[inherit] bg-(--room-paper)", className)}>
      <div ref={hostRef} className="absolute inset-0" />

      <div ref={layerRef} className="group/plates pointer-events-none absolute inset-0" data-detail="false">
        {landmarks
          .filter((landmark) => editing || landmark.label)
          .map((landmark) => (
            <div
              key={landmark.id}
              ref={(node) => {
                if (node) plateRefs.current.set(`landmark:${landmark.id}`, node);
                else plateRefs.current.delete(`landmark:${landmark.id}`);
              }}
              className={cn(
                "absolute top-0 left-0 text-[10px] font-medium tracking-wide whitespace-nowrap text-(--room-ink)/70 uppercase",
                (landmark.toLevelId || editing) && "pointer-events-auto",
              )}
            >
              {editing && (
                <button
                  type="button"
                  aria-pressed={landmark.id === selectedLandmarkId}
                  onClick={() => {
                    onTableSelect(null);
                    onLandmarkSelect?.(landmark.id);
                  }}
                  className={cn(
                    "rounded-sm bg-(--room-chip) px-1 outline-none focus-visible:ring-2 focus-visible:ring-(--room-ink)",
                    landmark.id === selectedLandmarkId && "bg-(--room-plate) text-(--room-plate-foreground)",
                  )}
                >
                  {landmark.label || landmark.kind}
                </button>
              )}
              {!editing && landmark.toLevelId && (
                <button
                  type="button"
                  onClick={() => landmark.toLevelId && onLevelChange(landmark.toLevelId)}
                  className="rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-(--room-ink)"
                >
                  {landmark.label} ↗
                </button>
              )}
              {!editing && !landmark.toLevelId && landmark.label}
            </div>
          ))}

        {tables.map((table) => {
          const reading = readings.get(table.id);
          const state = reading?.state ?? "free";
          const selected = table.id === selectedTableId;
          const PlateIcon = tableStateCues[editing ? editingState(table) : state].icon;
          return (
            <button
              key={table.id}
              type="button"
              ref={(node) => {
                if (node) plateRefs.current.set(table.id, node);
                else plateRefs.current.delete(table.id);
              }}
              onClick={(event) => {
                keyboardPlateRef.current = event.detail === 0 ? table.id : null;
                onLandmarkSelect?.(null);
                onTableSelect(selected ? null : table.id);
              }}
              aria-pressed={selected}
              data-candidate={candidateTableIds.has(table.id)}
              aria-label={
                editing
                  ? `${table.label}, ${table.capacity} seats`
                  : `${table.label}, ${table.capacity} seats, ${tableStateLabels[state]}. ${describe(table.id)}`
              }
              className={cn(
                "pointer-events-auto absolute top-0 left-0 flex flex-col items-center gap-1 outline-none",
                !editing && selectedTableId && !selected && !candidateTableIds.has(table.id) && "opacity-35",
              )}
            >
              <span
                className={cn(
                  "flex items-center gap-1 rounded-md bg-(--room-plate) px-1.5 py-0.5 text-[13px] leading-none font-semibold text-(--room-plate-foreground) tabular-nums shadow-sm ring-1 ring-(--room-plate-rim)",
                  selected && "ring-2 ring-(--room-plate-foreground) ring-offset-2 ring-offset-(--room-plate)",
                )}
              >
                {PlateIcon && <PlateIcon aria-hidden="true" className="size-3" />}
                {table.label}
              </span>
              <span
                className={cn(
                  "hidden max-w-36 truncate rounded-md bg-(--room-chip) px-1.5 py-0.5 text-[10px] leading-tight text-(--room-ink) shadow-sm",
                  !editing && "group-data-[detail=true]/plates:block",
                )}
              >
                {reading?.reservation ? `${reading.reservation.guest} · ` : ""}
                {describe(table.id)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <SegmentedControl
          label="Level"
          value={level?.id ?? ""}
          options={levelOptions}
          onValueChange={onLevelChange}
          className="liquid-glass-solid pointer-events-auto"
        />
        <SegmentedControl
          label="Camera angle"
          value={view}
          options={viewOptions}
          onValueChange={changeView}
          className="liquid-glass-solid pointer-events-auto"
        />
      </div>

      {banner && (
        <div className="pointer-events-none absolute inset-x-0 top-14 flex justify-center px-3 *:pointer-events-auto">
          {banner}
        </div>
      )}

      <div className="absolute right-3 bottom-3">
        <ButtonGroup
          orientation="vertical"
          aria-label="Camera"
          className="liquid-glass liquid-glass-solid rounded-2xl p-0.5"
        >
          {[
            { label: "Zoom in", icon: Plus, run: () => engineRef.current?.zoomBy(ZOOM_BUTTON_STEP) },
            { label: "Zoom out", icon: Minus, run: () => engineRef.current?.zoomBy(1 / ZOOM_BUTTON_STEP) },
            { label: "Fit the room", icon: Maximize, run: () => engineRef.current?.fit() },
            { label: "Rotate 90°", icon: RotateCw, run: () => engineRef.current?.rotateQuarter() },
          ].map((control) => (
            <Tooltip key={control.label}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={control.label}
                  onClick={control.run}
                  className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground size-8 rounded-xl"
                >
                  <control.icon />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{control.label}</TooltipContent>
            </Tooltip>
          ))}
        </ButtonGroup>
      </div>

      <ul className="absolute bottom-3 left-3 flex flex-wrap gap-1.5" aria-label="Tables by state">
        {counts.map(({ state, count }) => (
          <li
            key={state}
            className="liquid-glass liquid-glass-solid text-foreground flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]"
          >
            <span aria-hidden="true" className={cn("size-2.5 rounded-full", stateSwatch[state])} />
            <LegendIcon state={state} />
            {tableStateLabels[state]}
            <span className="tabular-nums">{count}</span>
          </li>
        ))}
      </ul>

      <Popover
        open={!editing && Boolean(selectedTableId) && callout !== null}
        onOpenChange={(open) => {
          if (!open) onTableSelect(null);
        }}
      >
        <PopoverAnchor asChild>
          <div ref={anchorRef} className="pointer-events-none absolute top-0 left-0 size-px" />
        </PopoverAnchor>
        <PopoverContent
          // One content per table, so each keyboard selection moves focus into its own callout.
          key={selectedTableId}
          side="right"
          align="center"
          sideOffset={28}
          collisionPadding={12}
          updatePositionStrategy="always"
          onOpenAutoFocus={(event) => {
            if (!keyboardPlateRef.current) event.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (keyboardPlateRef.current) plateRefs.current.get(keyboardPlateRef.current)?.focus();
          }}
          // Plates and the canvas inside the room manage the selection themselves.
          onInteractOutside={(event) => {
            if (event.target instanceof Node && hostRef.current?.contains(event.target)) event.preventDefault();
          }}
          className="w-72"
        >
          {callout}
        </PopoverContent>
      </Popover>
    </div>
  );
}
