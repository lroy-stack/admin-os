"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";

import type { TaskFields } from "./board-state";
import { taskOwnerProfiles, taskPriorities, taskTeams } from "./data";
import { kanbanMessageKey } from "./messages";
import { useTaskBoard } from "./task-board-context";
import {
  emptyTaskForm,
  formToFields,
  type TaskFormInput,
  type TaskFormValues,
  taskFormSchema,
  taskToForm,
} from "./task-form";
import type { ColumnId, Task } from "./types";

export interface TaskFormWindowProps {
  /** The task being edited, or `null` for New task. */
  task: Task | null;
  /** The column of the task, or the one a new task starts in (the column's +). */
  status: ColumnId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSave: (fields: TaskFields, status: ColumnId) => void;
}

/**
 * New task and Edit task: one `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts from
 * the task or a blank form. Demo-local: it says so in its footer.
 */
export function TaskFormWindow({ task, status, open, onOpenChange, returnFocus, onSave }: TaskFormWindowProps) {
  const text = useMessages(kanbanMessageKey);
  const form = text.task.form;
  const board = useTaskBoard();
  const schema = useMemo(() => taskFormSchema(form.errors), [form.errors]);
  const editing = task !== null;

  const windowForm = useWindowForm<TaskFormInput, TaskFormValues>(schema, {
    defaultValues: task ? taskToForm(task, status) : emptyTaskForm(status),
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      const parsed = formToFields(values);
      onSave(parsed.fields, parsed.status);
      return { status: "ok", value: undefined };
    },
    onDone: () => onOpenChange(false),
  });
  const { control } = windowForm.form;

  return (
    <FormDialog
      demo
      open={open}
      onOpenChange={onOpenChange}
      dirty={windowForm.dirty}
      title={editing ? form.editTitle : form.createTitle}
      description={form.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={editing ? form.editVerb : form.createVerb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={control} name="title" label={form.title} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <FormField control={control} name="description" label={form.details} readOnly={windowForm.awaiting}>
          {({ readOnly, ...field }) => <Textarea {...field} readOnly={readOnly} rows={3} />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField control={control} name="status" label={form.status} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {board.columns.map((column) => (
                  <NativeSelectOption key={column.id} value={column.id}>
                    {board.columnName(column.id)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="priority" label={form.priority} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {taskPriorities.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {text.priorities[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="team" label={form.team} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {taskTeams.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {text.teams[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="ownerName" label={form.owner} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                <NativeSelectOption value="">{form.ownerPlaceholder}</NativeSelectOption>
                {taskOwnerProfiles.map((owner) => (
                  <NativeSelectOption key={owner.name} value={owner.name}>
                    {owner.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
        <FormField control={control} name="dueDate" label={form.dueDate} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} type="date" />}
        </FormField>
      </form>
    </FormDialog>
  );
}
