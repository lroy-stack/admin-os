"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { cn } from "cn";
import {
  Armchair,
  Clock,
  Ellipsis,
  ListOrdered,
  Maximize2,
  Minimize2,
  PencilRuler,
  Plus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format, formatCalendarDate, formatNumber, useLocale, useMessages } from "@/core/i18n/client";
import type { ReadStatus } from "@/core/result";
import {
  FilterChip,
  PageHeader,
  PeriodStepper,
  SearchCapsule,
  SegmentedControl,
  type SegmentedOption,
  toneSolid,
} from "@/ds/components";
import { ReadState } from "@/ds/feedback";
import type { CapabilityActionOptions } from "@/ds/forms";
import { ResponsivePanel, useViewport } from "@/ds/overlays";

import type { BookingAbilities } from "./abilities";
import { BookingWritesProvider, useStatusWrites } from "./booking-writes";
import { findTable, locateTables, type TableLocation, totalSeats } from "./floor/floor-model";
import type { SceneMove } from "./floor/floor-scene";
import { findPlanIssues } from "./floor/plan-edits";
import { zoneName } from "./floor/plan-names";
import { type EditSelection, RoomEditorPanel, RoomEditorToolbar } from "./floor/room-editor";
import { TableCallout } from "./floor/table-callout";
import { canSeat, describeReading, readTable } from "./floor/table-state";
import { useFloorPlan } from "./floor/use-floor-plan";
import { mockVenue } from "./floor/venue";
import { FullViewFrame } from "./full-view-frame";
import { bookingsMessageKey } from "./messages";
import { NewReservationDialog, type ReservationRequest } from "./new-reservation-dialog";
import { planRail } from "./rail/rail-plan";
import { RailStrip } from "./rail/rail-strip";
import { TimeRail } from "./rail/time-rail";
import { ReservationDrawer } from "./reservation-drawer";
import { formatClock, guestName, isActive, isLate, isUnassigned } from "./reservation-status";
import { ReservationsAgenda } from "./reservations-agenda";
import { ReservationsList } from "./reservations-list";
import { ServiceFloor, SHEET_PEEK, type SheetSnap } from "./service-floor";
import {
  noLocalChanges,
  patchLocal,
  type Reservation,
  type ReservationStatus,
  type ServiceDay,
  shiftDay,
  withLocalChanges,
} from "./view-model";
import { WalkInDialog, type WalkInRequest } from "./walk-in-dialog";

// The room engine (three.js) only loads when the Floor view is shown.
const FloorView = dynamic(() => import("./floor/floor-view").then((module) => module.FloorView), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type View = "floor" | "agenda" | "list";
type Alert = "unassigned" | "late" | "pending";

const ALERTS: readonly Alert[] = ["unassigned", "late", "pending"];

function matchesAlert(alert: Alert, reservation: Reservation, service: ServiceDay) {
  switch (alert) {
    case "unassigned":
      return isUnassigned(reservation);
    case "late":
      return isLate(reservation, service.nowMin, service.lateAfterMin);
    case "pending":
      return reservation.status === "pending";
    default: {
      const unreachable: never = alert;
      return unreachable;
    }
  }
}

const ROUTE = "/dashboard/bookings";
const NO_TABLES: ReadonlySet<string> = new Set();
const RAIL_COLLAPSED_KEY = "bookings.rail-collapsed";

/** Tables that can take `party` for its whole booking. */
function fittingTables(
  locations: readonly TableLocation[],
  party: Reservation,
  reservations: readonly Reservation[],
  nowMin: number,
) {
  return locations.filter(({ table }) => canSeat(table, party, reservations, nowMin));
}

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export interface ReservationsProps {
  /** The state of the day's read; `empty` is a day without bookings. */
  state: ReadStatus;
  /** The translated reason of a failed or refused read. */
  reason?: string;
  /** Null when the clock or the settings could not be read: there is no day to show. */
  service: ServiceDay | null;
  reservations: Reservation[];
  /** What the role may do; a control it may not use is not rendered. */
  can: BookingAbilities;
  /** The bookings module's error texts, for the windows that write. */
  errors: CapabilityActionOptions["errors"];
}

/** The service screen for the business day it is given, or the reason there is none. */
export function Reservations({ state, reason, service, reservations, can, errors }: ReservationsProps) {
  return service === null ? (
    <BookingsUnavailable state={state} reason={reason} />
  ) : (
    <ServiceScreen
      state={state}
      reason={reason}
      service={service}
      dayReservations={reservations}
      can={can}
      errors={errors}
    />
  );
}

function BookingsUnavailable({ state, reason }: { state: ReadStatus; reason?: string }) {
  const text = useMessages(bookingsMessageKey);
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={text.title} kpis={[]} />
      <ReadState state={state} reason={reason} onRetry={() => router.refresh()} emptyTitle={text.empty.title}>
        {null}
      </ReadState>
    </div>
  );
}

function ServiceScreen({
  state,
  reason,
  service,
  dayReservations: loaded,
  can,
  errors,
}: {
  state: ReadStatus;
  reason?: string;
  service: ServiceDay;
  dayReservations: Reservation[];
  can: BookingAbilities;
  errors: CapabilityActionOptions["errors"];
}) {
  const text = useMessages(bookingsMessageKey);
  const locale = useLocale();
  const router = useRouter();
  const [changingDay, startDayChange] = useTransition();
  const viewOptions: SegmentedOption<View>[] = [
    { value: "floor", label: text.views.floor },
    { value: "agenda", label: text.views.agenda },
    { value: "list", label: text.views.list },
  ];
  const alertLabels: Record<Alert, string> = text.alerts;
  const isMobile = useViewport() === "phone";
  const { plan: venue, edit, undo, canUndo, reset } = useFloorPlan(mockVenue);
  const [changes, setChanges] = useState(() => noLocalChanges(service.businessDay));
  const [view, setView] = useState<View>("floor");
  const [query, setQuery] = useState("");
  const [alerts, setAlerts] = useState<ReadonlySet<Alert>>(new Set());
  const [showClosed, setShowClosed] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState(mockVenue.levels[0]?.id ?? "");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [railOpen, setRailOpen] = useState(false);
  const [fullView, setFullView] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editSelection, setEditSelection] = useState<EditSelection>(null);
  const [editPanelOpen, setEditPanelOpen] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>(SHEET_PEEK);
  const [walkIn, setWalkIn] = useState<WalkInRequest | null>(null);
  const [reservation, setReservation] = useState<ReservationRequest | null>(null);

  // Folding the rail is a per-browser preference.
  useEffect(() => {
    try {
      setRailCollapsed(window.localStorage.getItem(RAIL_COLLAPSED_KEY) === "true");
    } catch {
      // Storage blocked: keep the rail open.
    }
  }, []);

  function changeRailCollapsed(collapsed: boolean) {
    setRailCollapsed(collapsed);
    try {
      window.localStorage.setItem(RAIL_COLLAPSED_KEY, String(collapsed));
    } catch {
      // Storage blocked: the choice lasts for this visit.
    }
  }

  const locations = useMemo(() => locateTables(venue), [venue]);
  const level = venue.levels.find((item) => item.id === levelId) ?? venue.levels[0];

  // Steps show at once and roll back on failure; table assignments and walk-ins still sit over the day until B7 / B4.
  const writes = useStatusWrites(loaded, errors);
  const dayReservations = withLocalChanges(writes.reservations, changes, service.businessDay);
  const active = dayReservations.filter(isActive);
  const shown = state.status === "ready" || state.status === "empty";

  function goToDay(day: string | null) {
    startDayChange(() => {
      router.push(day === null ? ROUTE : `${ROUTE}?day=${day}`, { scroll: false });
    });
  }
  const needle = normalize(query.trim());

  const filtered = dayReservations
    .filter((reservation) => showClosed || isActive(reservation))
    .filter((reservation) => !needle || normalize(`${guestName(reservation, text)} ${reservation.id}`).includes(needle))
    .filter(
      (reservation) => alerts.size === 0 || [...alerts].some((alert) => matchesAlert(alert, reservation, service)),
    )
    .sort((a, b) => a.startMin - b.startMin);

  const readings = useMemo(
    () => new Map(locations.map(({ table }) => [table.id, readTable(table, dayReservations, service.nowMin)])),
    [locations, dayReservations, service.nowMin],
  );

  const railPlan = planRail({
    reservations: filtered,
    seatHolders: dayReservations,
    nowMin: service.nowMin,
    windowStartMin: service.window.startMin,
    windowEndMin: service.window.endMin,
    totalSeats: totalSeats(venue),
  });
  const nowSlot = railPlan.slots.find((slot) => slot.isNow);
  const railSummary = nowSlot
    ? format(text.rail.summary, locale, {
        time: formatClock(nowSlot.startMin, locale),
        arrivals: format(text.rail.arrivals, locale, { count: nowSlot.arrivals }),
        free: format(text.rail.free, locale, { count: nowSlot.freeSeats }),
      })
    : text.rail.closed;

  const assigning = dayReservations.find((reservation) => reservation.id === assigningId) ?? null;
  const candidates = useMemo(
    () => (assigning ? fittingTables(locations, assigning, dayReservations, service.nowMin) : []),
    [assigning, locations, dayReservations, service.nowMin],
  );
  const candidateTableIds = useMemo(
    () => (candidates.length > 0 ? new Set(candidates.map(({ table }) => table.id)) : NO_TABLES),
    [candidates],
  );

  const seatedGuests = active
    .filter((reservation) => reservation.status === "seated")
    .reduce((total, reservation) => total + reservation.partySize, 0);
  const nextArrival = active
    .filter((reservation) => reservation.status !== "seated" && reservation.startMin >= service.nowMin)
    .sort((a, b) => a.startMin - b.startMin)[0];
  const freeTables = [...readings.values()].filter((reading) => reading.state === "free").length;
  const details = dayReservations.find((reservation) => reservation.id === detailsId) ?? null;
  const selectedLocation = selectedTableId ? findTable(venue, selectedTableId) : undefined;
  const selectedReading = selectedTableId ? readings.get(selectedTableId) : undefined;
  const issues = useMemo(() => (editing ? findPlanIssues(venue) : []), [editing, venue]);

  function updateReservation(id: string, change: Partial<Reservation>) {
    setChanges((current) => patchLocal(current, service.businessDay, id, change));
  }

  function advance(id: string, to: ReservationStatus) {
    const reservation = dayReservations.find((candidate) => candidate.id === id);
    if (reservation) writes.advance(reservation, to);
  }

  function selectTable(tableId: string | null) {
    if (tableId && assigning && candidateTableIds.has(tableId)) {
      updateReservation(assigning.id, {
        tableIds: [tableId],
        tableLabels: [findTable(venue, tableId)?.table.label ?? tableId],
      });
      setAssigningId(null);
      setSelectedReservationId(assigning.id);
      setSelectedTableId(tableId);
      return;
    }
    setSelectedTableId(tableId);
    setSelectedReservationId(tableId ? (readings.get(tableId)?.reservation?.id ?? null) : null);
  }

  function selectReservation(reservation: Reservation) {
    setSelectedReservationId(reservation.id);
    setRailOpen(false);
    // Drop the phone sheet to its peek so the focused table and the assign banner show.
    setSheetSnap(SHEET_PEEK);
    // A booking whose tables were removed from the plan is treated as unassigned.
    const tableId = reservation.tableIds.find((id) => findTable(venue, id));
    if (!tableId) {
      setSelectedTableId(null);
      setAssigningId(isActive(reservation) && !editing ? reservation.id : null);
      // Show a level that has a table the party fits on.
      const fitting = fittingTables(locations, reservation, dayReservations, service.nowMin);
      const onThisLevel = fitting.some((location) => location.level.id === levelId);
      const firstLevel = fitting[0]?.level.id;
      if (!onThisLevel && firstLevel) setLevelId(firstLevel);
      return;
    }
    setAssigningId(null);
    const location = findTable(venue, tableId);
    if (location) setLevelId(location.level.id);
    setSelectedTableId(tableId);
  }

  /** The one Walk-in window: from the header with a count, or from a free table's callout with the table preset. */
  function openWalkIn(covers: number, tableId: string | null) {
    // On a phone the callout is a sheet of its own; the window replaces it rather than stacking on top of it.
    if (tableId !== null && isMobile) selectTable(null);
    setWalkIn((current) => ({ covers, tableId, opening: (current?.opening ?? 0) + 1, open: true }));
  }

  /** The New reservation panel, starting from the day on screen. */
  function openNewReservation() {
    setReservation((current) => ({
      date: service.businessDay,
      covers: 2,
      opening: (current?.opening ?? 0) + 1,
      open: true,
    }));
  }

  function toggleAlert(alert: Alert) {
    setAlerts((current) => {
      const next = new Set(current);
      if (next.has(alert)) next.delete(alert);
      else next.add(alert);
      return next;
    });
  }

  function startEditing() {
    setView("floor");
    setEditing(true);
    setSelectedTableId(null);
    setAssigningId(null);
    setEditSelection(null);
  }

  function moveElement(move: SceneMove) {
    edit(
      move.kind === "table"
        ? { type: "moveTable", tableId: move.id, xCm: move.xCm, yCm: move.yCm }
        : { type: "moveLandmark", landmarkId: move.id, xCm: move.xCm, yCm: move.yCm },
    );
  }

  const editTableId = editSelection?.kind === "table" ? editSelection.id : null;
  const editTargetZoneId =
    level?.zones.find((zone) =>
      editSelection?.kind === "zone"
        ? zone.id === editSelection.id
        : zone.tables.some((table) => table.id === editSelection?.id),
    )?.id ??
    level?.zones[0]?.id ??
    null;

  const callout =
    !editing && selectedLocation && selectedReading ? (
      <TableCallout
        key={selectedLocation.table.id}
        table={selectedLocation.table}
        zoneName={zoneName(selectedLocation.zone, text.venue)}
        reading={selectedReading}
        onAdvance={advance}
        onOpenDetails={setDetailsId}
        onSeatWalkIn={(tableId, covers) => openWalkIn(covers, tableId)}
      />
    ) : null;

  const assigningBanner = assigning ? (
    <div className="liquid-glass liquid-glass-solid text-foreground flex max-w-full items-center gap-2 rounded-full py-1 pr-1 pl-4 text-sm">
      <span className="min-w-0 text-left break-words">
        {candidates.length > 0
          ? format(text.assign.prompt, locale, {
              guest: guestName(assigning, text),
              party: format(text.party, locale, { count: assigning.partySize }),
              count: candidates.length,
            })
          : format(text.assign.noneFit, locale, {
              party: format(text.party, locale, { count: assigning.partySize }),
              time: formatClock(assigning.startMin, locale),
            })}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={text.assign.stop}
        className="text-foreground/70 hover:bg-foreground/10 hover:text-foreground size-7 shrink-0 rounded-full"
        onClick={() => setAssigningId(null)}
      >
        <X />
      </Button>
    </div>
  ) : undefined;

  const editorToolbar =
    editing && level ? (
      <RoomEditorToolbar
        level={level}
        nextLevelNumber={Math.max(0, ...venue.levels.map((item) => item.index)) + 1}
        targetZoneId={editTargetZoneId}
        selection={editSelection}
        onEdit={edit}
        onSelect={setEditSelection}
        canUndo={canUndo}
        onUndo={undo}
        onReset={reset}
        onDone={() => {
          setEditing(false);
          setEditSelection(null);
          setEditPanelOpen(false);
        }}
        onOpenPanel={isMobile ? () => setEditPanelOpen(true) : undefined}
      />
    ) : undefined;

  const editorPanel =
    editing && level ? (
      <RoomEditorPanel
        plan={venue}
        level={level}
        selection={editSelection}
        issues={issues}
        onEdit={edit}
        onSelect={setEditSelection}
        className={cn("border-0 ring-0", isMobile ? "max-h-[60dvh]" : "h-full rounded-none bg-transparent")}
      />
    ) : null;

  // Phones in full view: one compact toolbar so the room keeps the screen.
  const compact = fullView && isMobile;

  const fullViewToggle = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={text.actions.fullView}
          aria-pressed={fullView}
          className="liquid-glass hover:bg-foreground/10 size-9 rounded-full"
          onClick={() => setFullView((current) => !current)}
        >
          {fullView ? <Minimize2 /> : <Maximize2 />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{fullView ? text.actions.exitFullView : text.actions.fullView}</TooltipContent>
    </Tooltip>
  );

  const toolsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={text.actions.tools}
          className="liquid-glass hover:bg-foreground/10 size-9 rounded-full"
        >
          <Ellipsis />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-60">
        <DropdownMenuCheckboxItem checked={showClosed} onCheckedChange={(checked) => setShowClosed(checked === true)}>
          {text.actions.showClosed}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={startEditing}>
          <PencilRuler />
          {text.actions.editRoom}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const rail = (
    <TimeRail
      plan={railPlan}
      selectedReservationId={selectedReservationId}
      onSelect={selectReservation}
      className="h-full"
    />
  );

  const alertChips = (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label={text.alerts.label}>
      {ALERTS.map((alert) => (
        <li key={alert}>
          <FilterChip pressed={alerts.has(alert)} onPressedChange={() => toggleAlert(alert)}>
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", toneSolid[alert === "pending" ? "azure" : "salmon"])}
            />
            <span className="tabular-nums">
              {formatNumber(active.filter((reservation) => matchesAlert(alert, reservation, service)).length, locale)}
            </span>
            {alertLabels[alert]}
          </FilterChip>
        </li>
      ))}
    </ul>
  );

  return (
    <BookingWritesProvider value={{ can, errors, busy: writes.busy }}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title={text.title}
          kpis={
            !shown
              ? []
              : [
                  {
                    icon: UsersRound,
                    value: `${formatNumber(seatedGuests, locale)}/${formatNumber(totalSeats(venue), locale)}`,
                    label: text.kpis.seated,
                  },
                  {
                    icon: Clock,
                    value: nextArrival ? formatClock(nextArrival.startMin, locale) : "—",
                    label: nextArrival
                      ? format(text.kpis.nextArrival, locale, {
                          guest: guestName(nextArrival, text),
                          party: format(text.partyShort, locale, { count: nextArrival.partySize }),
                        })
                      : text.kpis.noMoreArrivals,
                  },
                  { icon: Armchair, value: formatNumber(freeTables, locale), label: text.kpis.tablesFree },
                ]
          }
        />

        <FullViewFrame active={fullView} onExit={() => setFullView(false)} label={text.actions.fullViewRegion}>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <PeriodStepper
                label={text.stepper.label}
                previousLabel={text.stepper.previousDay}
                todayLabel={text.stepper.today}
                nextLabel={text.stepper.nextDay}
                onPrevious={() => goToDay(shiftDay(service.businessDay, -1))}
                onToday={() => goToDay(null)}
                onNext={() => goToDay(shiftDay(service.businessDay, 1))}
              />
              <h2 className={cn("ml-2 text-xl font-medium tracking-tight", compact && "text-lg")} aria-live="polite">
                {formatCalendarDate(service.businessDay, locale, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
                {service.isToday && (
                  <span className="text-muted-foreground ml-2 text-sm font-normal tabular-nums">
                    {`· ${formatClock(service.nowMin, locale)}`}
                  </span>
                )}
              </h2>
              {/* Phones keep the toggle in one place in both modes, so focus stays on it when full view opens. */}
              {isMobile && <div className="ml-auto">{fullViewToggle}</div>}
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <SegmentedControl label={text.views.label} value={view} options={viewOptions} onValueChange={setView} />
                {can.seat && service.isToday ? (
                  <Button
                    variant="ghost"
                    className="liquid-glass hover:bg-foreground/10 h-9 rounded-full px-4"
                    onClick={() => openWalkIn(2, null)}
                  >
                    <UserPlus data-icon="inline-start" />
                    {text.actions.walkIn}
                  </Button>
                ) : null}
                {can.reserve && compact ? (
                  <Button
                    size="icon"
                    aria-label={text.actions.newReservation}
                    className="liquid-glass-brand size-9 rounded-full"
                    onClick={openNewReservation}
                  >
                    <Plus />
                  </Button>
                ) : null}
                {can.reserve && !compact ? (
                  <Button className="liquid-glass-brand h-9 rounded-full px-4" onClick={openNewReservation}>
                    <Plus data-icon="inline-start" />
                    {text.actions.newReservation}
                  </Button>
                ) : null}
                {compact && toolsMenu}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Compact keeps a running search visible so an active filter never hides. */}
              {(!compact || query) && (
                <SearchCapsule
                  label={text.search.label}
                  placeholder={text.search.placeholder}
                  className="sm:w-72"
                  value={query}
                  onValueChange={setQuery}
                />
              )}
              {alertChips}
              {!compact && (
                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  {view === "floor" && !fullView && (
                    <Button
                      variant="ghost"
                      className="liquid-glass hover:bg-foreground/10 h-9 rounded-full px-4 md:hidden"
                      onClick={() => setRailOpen(true)}
                    >
                      <ListOrdered data-icon="inline-start" />
                      {text.actions.arrivals}
                    </Button>
                  )}
                  {toolsMenu}
                  {!isMobile && fullViewToggle}
                </div>
              )}
            </div>
          </div>

          <div
            aria-busy={changingDay}
            className={cn(
              "transition-opacity",
              changingDay && "opacity-60",
              fullView && "min-h-0 flex-1",
              fullView && view !== "floor" && "overflow-y-auto",
            )}
          >
            <ReadState
              state={state}
              reason={reason}
              onRetry={() => router.refresh()}
              emptyTitle={text.empty.title}
              emptyDescription={text.empty.description}
              emptyAction={
                service.isToday ? undefined : (
                  <Button variant="ghost" className="liquid-glass h-9 rounded-full px-4" onClick={() => goToDay(null)}>
                    {text.empty.backToToday}
                  </Button>
                )
              }
            >
              {view === "floor" && (
                <ServiceFloor
                  fullView={fullView}
                  railCollapsed={railCollapsed}
                  onRailCollapsedChange={changeRailCollapsed}
                  rail={rail}
                  railStrip={<RailStrip plan={railPlan} onExpand={() => changeRailCollapsed(false)} />}
                  railTitle={text.rail.title}
                  railSummary={railSummary}
                  isMobile={isMobile}
                  sheetSnap={sheetSnap}
                  onSheetSnapChange={setSheetSnap}
                  aside={editing && !isMobile ? editorPanel : undefined}
                  room={
                    <FloorView
                      plan={venue}
                      levelId={level?.id ?? ""}
                      onLevelChange={(next) => {
                        setLevelId(next);
                        // The callout and focus belong to a table on the level being left.
                        setSelectedTableId(null);
                        setEditSelection(null);
                      }}
                      readings={readings}
                      describe={(tableId) => {
                        const reading = readings.get(tableId);
                        return reading ? describeReading(reading, text, locale, service.nowMin) : "";
                      }}
                      mode={editing ? "edit" : "service"}
                      selectedTableId={editing ? editTableId : selectedTableId}
                      selectedLandmarkId={editSelection?.kind === "landmark" ? editSelection.id : null}
                      candidateTableIds={candidateTableIds}
                      onTableSelect={(tableId) => {
                        if (!editing) {
                          selectTable(tableId);
                          return;
                        }
                        if (tableId) setEditSelection({ kind: "table", id: tableId });
                        else setEditSelection((current) => (current?.kind === "table" ? null : current));
                      }}
                      onLandmarkSelect={(landmarkId) => {
                        if (landmarkId) setEditSelection({ kind: "landmark", id: landmarkId });
                        else setEditSelection((current) => (current?.kind === "landmark" ? null : current));
                      }}
                      onMove={moveElement}
                      callout={isMobile ? null : callout}
                      banner={editing ? editorToolbar : assigningBanner}
                      className="size-full"
                    />
                  }
                />
              )}
              {view === "agenda" && (
                <ReservationsAgenda
                  reservations={filtered}
                  tables={locations}
                  service={service}
                  onOpen={setDetailsId}
                />
              )}
              {view === "list" && (
                <ReservationsList reservations={filtered} service={service} onOpen={setDetailsId} onAdvance={advance} />
              )}
            </ReadState>
          </div>
        </FullViewFrame>

        {isMobile && !fullView && (
          <ResponsivePanel
            open={railOpen}
            onOpenChange={setRailOpen}
            title={text.rail.title}
            description={railSummary}
            className="h-[80dvh]"
            headerClassName="pb-0"
          >
            {rail}
          </ResponsivePanel>
        )}

        {isMobile && (
          <Drawer
            open={view === "floor" && callout !== null}
            onOpenChange={(open) => {
              if (!open) selectTable(null);
            }}
          >
            <DrawerContent>
              <DrawerHeader className="sr-only">
                <DrawerTitle>
                  {format(text.sheets.tableTitle, locale, { label: selectedLocation?.table.label ?? "" })}
                </DrawerTitle>
                <DrawerDescription>{text.sheets.tableDescription}</DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-8">{callout}</div>
            </DrawerContent>
          </Drawer>
        )}

        {isMobile && editing && (
          <Drawer
            open={editSelection !== null || editPanelOpen}
            onOpenChange={(open) => {
              if (open) return;
              setEditSelection(null);
              setEditPanelOpen(false);
            }}
          >
            <DrawerContent>
              <DrawerHeader className="sr-only">
                <DrawerTitle>{text.sheets.editTitle}</DrawerTitle>
                <DrawerDescription>{text.sheets.editDescription}</DrawerDescription>
              </DrawerHeader>
              {editorPanel}
            </DrawerContent>
          </Drawer>
        )}

        <WalkInDialog
          request={walkIn}
          onOpenChange={(open) => setWalkIn((current) => (current === null ? null : { ...current, open }))}
          locations={locations}
          reservations={dayReservations}
          service={service}
          errors={errors}
        />

        <NewReservationDialog
          request={reservation}
          onOpenChange={(open) => setReservation((current) => (current === null ? null : { ...current, open }))}
          locations={locations}
          service={service}
          errors={errors}
          onShowDay={goToDay}
        />

        <ReservationDrawer
          reservation={details}
          service={service}
          onOpenChange={(open) => {
            if (!open) setDetailsId(null);
          }}
          onAdvance={advance}
        />
      </div>
    </BookingWritesProvider>
  );
}
