"use client";

import { type Dispatch, type ReactNode, type SetStateAction, useCallback, useMemo, useRef, useState } from "react";

import { toast } from "sonner";

import { format, useLocale, useMessages } from "@/core/i18n/client";
import { useToastWithUndo } from "@/ds/feedback";
import { ConfirmAction } from "@/ds/overlays";

import {
  addTask,
  columnNameOf,
  createModel,
  positionOf,
  relocateTask,
  removeColumn,
  removeTask,
  renameColumn,
  restoreColumn,
  restoreTask,
  type TaskFields,
  taskById,
  updateTask,
} from "./board-state";
import { ColumnRenameWindow } from "./column-rename-dialog";
import { kanbanMessageKey } from "./messages";
import { type TaskBoard, TaskBoardContext } from "./task-board-context";
import { TaskFormWindow } from "./task-form-dialog";
import { TaskPanel } from "./task-panel";
import type { BoardState, Column, ColumnId, Task } from "./types";

type Shown =
  | { kind: "panel" | "edit"; taskId: string; opening: number; open: boolean }
  | { kind: "create" | "rename"; columnId: ColumnId; opening: number; open: boolean };

/** The region (`data-task-region`) around a control, where focus lands when the control's task leaves the screen. */
const regionOf = (opener: Element | null) => opener?.closest<HTMLElement>("[data-task-region]") ?? null;

function focusRegion(region: HTMLElement | null) {
  requestAnimationFrame(() => {
    if (region?.isConnected) region.focus();
  });
}

/**
 * The board of a session and the windows every task and column opens, mounted once: the task panel, New task and Edit
 * task, Rename column, and the delete confirmations, plus the changes that offer undo. The data is demo-local: each
 * window that changes it says so (ADR 0015).
 */
export function TaskBoardProvider({ initialBoard, children }: { initialBoard: BoardState; children: ReactNode }) {
  const text = useMessages(kanbanMessageKey);
  const locale = useLocale();
  const withUndo = useToastWithUndo();
  const [model, setModel] = useState(() => createModel(initialBoard));
  const modelRef = useRef(model);
  modelRef.current = model;
  const opener = useRef<Element | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [opening, setOpening] = useState(0);
  const [deleting, setDeleting] = useState<
    { kind: "task"; task: Task; open: boolean } | { kind: "column"; columnId: ColumnId; open: boolean } | null
  >(null);

  const columnName = useCallback((id: ColumnId) => columnNameOf(model, id, text.columns[id]), [model, text.columns]);
  const columns = useMemo<Column[]>(() => model.columnOrder.map((id) => ({ id })), [model.columnOrder]);

  const setBoard = useCallback<Dispatch<SetStateAction<BoardState>>>((action) => {
    setModel((current) => ({ ...current, board: typeof action === "function" ? action(current.board) : action }));
  }, []);
  const setTableOrder = useCallback<Dispatch<SetStateAction<string[]>>>((action) => {
    setModel((current) => ({
      ...current,
      tableOrder: typeof action === "function" ? action([...current.tableOrder]) : action,
    }));
  }, []);
  const setColumnOrder = useCallback<Dispatch<SetStateAction<ColumnId[]>>>((action) => {
    setModel((current) => ({
      ...current,
      columnOrder: typeof action === "function" ? action([...current.columnOrder]) : action,
    }));
  }, []);

  function show(
    next: { kind: "panel" | "edit"; taskId: string } | { kind: "create" | "rename"; columnId: ColumnId },
    from: Element | null,
  ) {
    opener.current = from;
    setOpening(opening + 1);
    setShown({ ...next, opening: opening + 1, open: true });
  }

  function moveTask(task: Task, columnId: ColumnId, from: Element | null) {
    const before = positionOf(modelRef.current, task.id);
    if (!before || before.columnId === columnId) return;
    const region = regionOf(from);
    setModel((current) => relocateTask(current, task.id, columnId));
    focusRegion(region);
    withUndo({
      message: format(text.task.toast.moved, locale, { title: task.title, column: columnName(columnId) }),
      undo: () => setModel((current) => relocateTask(current, task.id, before.columnId, before.index)),
    });
  }

  function saveTask(fields: TaskFields, status: ColumnId, existing: Task | null) {
    if (existing) {
      setModel((current) => relocateTask(updateTask(current, existing.id, fields), existing.id, status));
    } else {
      setModel((current) => addTask(current, status, fields).model);
    }
    toast.success(existing ? text.task.toast.saved : text.task.toast.created);
  }

  const board: TaskBoard = {
    model,
    columns,
    columnName,
    setBoard,
    setTableOrder,
    setColumnOrder,
    openPanel: (task, from) => show({ kind: "panel", taskId: task.id }, from),
    openEdit: (task, from) => show({ kind: "edit", taskId: task.id }, from),
    openCreate: (columnId, from) => show({ kind: "create", columnId: columnId ?? columns[0]?.id ?? "ideas" }, from),
    askDelete: (task, from) => {
      opener.current = from;
      setDeleting({ kind: "task", task, open: true });
    },
    move: moveTask,
    openRename: (columnId, from) => show({ kind: "rename", columnId }, from),
    askDeleteColumn: (columnId, from) => {
      opener.current = from;
      setDeleting({ kind: "column", columnId, open: true });
    },
    noteDrop: (taskId, from) => {
      const now = positionOf(modelRef.current, taskId);
      const task = taskById(modelRef.current, taskId);
      if (!from || !now || !task || now.columnId === from.columnId) return;
      withUndo({
        message: format(text.task.toast.moved, locale, { title: task.title, column: columnName(now.columnId) }),
        undo: () => setModel((current) => relocateTask(current, taskId, from.columnId, from.index)),
      });
    },
  };

  const closeShown = (open: boolean) => setShown((current) => (current ? { ...current, open } : current));
  const panelTask = shown?.kind === "panel" || shown?.kind === "edit" ? taskById(model, shown.taskId) : undefined;
  const panelColumn = panelTask ? positionOf(model, panelTask.id)?.columnId : undefined;

  const editing = shown?.kind === "edit" && panelTask && panelColumn ? { task: panelTask, status: panelColumn } : null;
  const form = shown?.kind === "create" ? { task: null, status: shown.columnId } : editing;

  function confirmDelete(state: NonNullable<typeof deleting>): Promise<{ status: "ok" }> {
    const region = regionOf(opener.current);
    if (state.kind === "task") {
      const { task } = state;
      const position = positionOf(modelRef.current, task.id);
      setModel((current) => removeTask(current, task.id));
      focusRegion(region);
      withUndo({
        message: format(text.task.toast.deleted, locale, { title: task.title }),
        undo: () => {
          if (position) setModel((current) => restoreTask(current, task, position));
        },
      });
    } else {
      const { columnId } = state;
      const index = modelRef.current.columnOrder.indexOf(columnId);
      const name = columnName(columnId);
      setModel((current) => removeColumn(current, columnId));
      withUndo({
        message: format(text.column.toast.deleted, locale, { column: name }),
        undo: () => setModel((current) => restoreColumn(current, columnId, index)),
      });
    }
    return Promise.resolve({ status: "ok" });
  }

  return (
    <TaskBoardContext.Provider value={board}>
      {children}
      {shown?.kind === "panel" && panelTask && panelColumn ? (
        <TaskPanel
          key={shown.opening}
          task={panelTask}
          columnId={panelColumn}
          open={shown.open}
          onOpenChange={closeShown}
          returnFocus={() => opener.current}
          onEdit={() => board.openEdit(panelTask, opener.current)}
          onDelete={() => board.askDelete(panelTask, opener.current)}
          onMove={(columnId) => board.move(panelTask, columnId, null)}
        />
      ) : null}
      {shown && form ? (
        <TaskFormWindow
          key={shown.opening}
          task={form.task}
          status={form.status}
          open={shown.open}
          onOpenChange={closeShown}
          returnFocus={() => opener.current}
          onSave={(fields, status) => saveTask(fields, status, form.task)}
        />
      ) : null}
      {shown?.kind === "rename" ? (
        <ColumnRenameWindow
          key={shown.opening}
          name={columnName(shown.columnId)}
          open={shown.open}
          onOpenChange={closeShown}
          returnFocus={() => opener.current}
          onSave={(name) => {
            const { columnId } = shown;
            const before = modelRef.current.columnNames[columnId];
            setModel((current) => renameColumn(current, columnId, name));
            withUndo({
              message: format(text.column.toast.renamed, locale, { column: name }),
              undo: () => setModel((current) => renameColumn(current, columnId, before)),
            });
          }}
        />
      ) : null}
      {deleting ? (
        <ConfirmAction
          destructive
          open={deleting.open}
          onOpenChange={(open) => setDeleting({ ...deleting, open })}
          returnFocus={() => opener.current}
          verb={deleting.kind === "task" ? text.task.confirm.verb : text.column.confirm.verb}
          title={deleting.kind === "task" ? text.task.confirm.title : text.column.confirm.title}
          consequence={
            deleting.kind === "task"
              ? format(text.task.confirm.consequence, locale, { title: deleting.task.title })
              : format(text.column.confirm.consequence, locale, {
                  column: columnName(deleting.columnId),
                  count: model.board[deleting.columnId].length,
                })
          }
          onConfirm={async () => confirmDelete(deleting)}
        />
      ) : null}
    </TaskBoardContext.Provider>
  );
}
