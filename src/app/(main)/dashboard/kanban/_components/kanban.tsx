"use client";

import * as React from "react";

import { useSearchParams } from "next/navigation";

import { move } from "@dnd-kit/helpers";
import {
  DragDropProvider,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
} from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { Kanban as KanbanIcon, List, Plus, Search, Table2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useMessages } from "@/core/i18n/client";

import { positionOf, type TaskPosition } from "./board-state";
import { isFiltering, NO_FILTERS, type TaskFilters, type TaskSort, viewBoard } from "./board-view";
import { columnIds } from "./data";
import { KanbanColumn } from "./kanban-column";
import { FilterPopover, SortMenu } from "./kanban-filters";
import { KanbanList } from "./kanban-list";
import { KanbanListDnd } from "./kanban-list-dnd";
import { KanbanTable } from "./kanban-table";
import { KanbanTableDnd } from "./kanban-table-dnd";
import { kanbanMessageKey } from "./messages";
import { TaskBoardProvider } from "./task-board";
import { useTaskBoard } from "./task-board-context";
import { TaskCard } from "./task-card";
import type { BoardState, ColumnId, Task } from "./types";

interface KanbanProps {
  initialBoard: BoardState;
}

type TaskDragData = {
  type: "task";
  task: Task;
  columnId: ColumnId;
};

function isColumnId(value: unknown): value is ColumnId {
  return typeof value === "string" && columnIds.includes(value as ColumnId);
}

function isTaskDragData(value: unknown): value is TaskDragData {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "task" &&
    "task" in value &&
    typeof value.task === "object" &&
    value.task !== null &&
    "columnId" in value &&
    isColumnId(value.columnId)
  );
}

/** The Projects board: three views of one demo-local board, with the windows of its tasks and columns. */
export function Kanban({ initialBoard }: KanbanProps) {
  return (
    <TaskBoardProvider initialBoard={initialBoard}>
      <KanbanScreen />
    </TaskBoardProvider>
  );
}

function KanbanScreen() {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const searchParams = useSearchParams();
  const requestedView = searchParams.get("view");
  const view = requestedView === "list" || requestedView === "table" ? requestedView : "board";
  const taskBoard = useTaskBoard();
  const { model, columns: orderedColumns } = taskBoard;
  const [filters, setFilters] = React.useState<TaskFilters>(NO_FILTERS);
  const [sort, setSort] = React.useState<TaskSort>("manual");
  const shown = React.useMemo(
    () => viewBoard(model.board, filters, sort, locale),
    [model.board, filters, sort, locale],
  );
  const boardBeforeDrag = React.useRef<BoardState>(model.board);
  const dragFrom = React.useRef<{ id: string; position: TaskPosition | undefined } | null>(null);

  function changeView(value: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", value);
    window.history.pushState(null, "", url);
  }

  function handleDragStart(event: DragStartEvent) {
    const { source } = event.operation;

    if (source?.type === "task") {
      boardBeforeDrag.current = model.board;
      dragFrom.current = { id: String(source.id), position: positionOf(model, String(source.id)) };
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (event.operation.source?.type === "task") {
      taskBoard.setBoard((currentBoard) => move(currentBoard, event));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { source } = event.operation;

    if (!source) {
      return;
    }

    if (event.canceled) {
      if (source.type === "task") {
        taskBoard.setBoard(boardBeforeDrag.current);
      }
      return;
    }

    if (source.type === "column") {
      taskBoard.setColumnOrder((currentOrder) => move(currentOrder, event));
    } else if (dragFrom.current) {
      taskBoard.noteDrop(dragFrom.current.id, dragFrom.current.position);
    }
  }

  return (
    <Tabs
      value={view}
      onValueChange={changeView}
      className="h-[calc(100dvh-var(--dashboard-header-height))] min-h-0 min-w-0 gap-0 overflow-hidden"
    >
      <div className="flex shrink-0 flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <TabsList className="w-full *:data-[slot=tabs-trigger]:flex-1 sm:w-fit sm:*:data-[slot=tabs-trigger]:flex-none">
          <TabsTrigger value="board" className="gap-2">
            <KanbanIcon />
            {text.views.board}
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List />
            {text.views.list}
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2">
            <Table2 />
            {text.views.table}
          </TabsTrigger>
        </TabsList>

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center 2xl:justify-end">
          <InputGroup className="min-w-0 sm:w-64 2xl:w-48">
            <InputGroupInput
              type="text"
              aria-label={text.toolbar.searchLabel}
              placeholder={text.toolbar.searchPlaceholder}
              value={filters.query}
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>
          <FilterPopover filters={filters} onChange={setFilters} />
          <SortMenu sort={sort} onChange={setSort} />
          <Button
            className="w-full sm:w-auto"
            onClick={(event) => taskBoard.openCreate(undefined, event.currentTarget)}
          >
            <Plus data-icon="inline-start" />
            {text.toolbar.addTask}
          </Button>
        </div>
      </div>

      <TabsContent value="board" className="min-h-0 min-w-0 flex-col data-[state=active]:flex">
        <DragDropProvider onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="bg-muted/25 [&::-webkit-scrollbar-thumb]:bg-border min-h-0 min-w-0 flex-1 scrollbar-thin [scrollbar-color:var(--border)_transparent] overflow-x-auto overflow-y-hidden px-4 pt-4 pb-0 lg:px-5 lg:pt-5 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
            <div
              className="inline-grid h-full min-w-full gap-4"
              style={{ gridTemplateColumns: `repeat(${orderedColumns.length}, minmax(20rem, 1fr))` }}
            >
              {orderedColumns.map((column, index) => (
                <KanbanColumn key={column.id} column={column} index={index} tasks={shown[column.id]} />
              ))}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {(source) => {
              if (source.type !== "task" || !isTaskDragData(source.data)) {
                return null;
              }

              const columnId = isSortable(source) && isColumnId(source.group) ? source.group : source.data.columnId;

              return <TaskCard task={source.data.task} columnId={columnId} isOverlay />;
            }}
          </DragOverlay>
        </DragDropProvider>
      </TabsContent>
      <TabsContent value="list" className="relative min-h-0 overflow-y-auto overscroll-y-contain">
        <KanbanListDnd board={model.board} setBoard={taskBoard.setBoard}>
          <KanbanList board={shown} columns={orderedColumns} />
        </KanbanListDnd>
      </TabsContent>
      <TabsContent value="table" className="min-h-0 min-w-0 flex-col data-[state=active]:flex">
        <KanbanTableDnd order={[...model.tableOrder]} setOrder={taskBoard.setTableOrder}>
          <KanbanTable
            board={shown}
            columns={orderedColumns}
            order={model.tableOrder}
            sort={sort}
            filtered={isFiltering(filters)}
          />
        </KanbanTableDnd>
      </TabsContent>
    </Tabs>
  );
}
