"use client";

import { useMemo } from "react";

import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useMessages } from "@/core/i18n/client";
import { type ActionOutcome, FormField, FormFooter, useWindowForm } from "@/ds/forms";
import { FormDialog, type ReturnFocus } from "@/ds/overlays";

import { labels, priorities, statuses, type Task } from "./data";
import { tasksMessageKey } from "./messages";
import { type TaskFormValues, taskFormSchema, taskToForm } from "./task-form";
import type { TaskFields } from "./tasks-state";

export interface TaskEditWindowProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: ReturnFocus;
  onSave: (fields: TaskFields) => void;
}

/**
 * Edit task: a `FormDialog` (ADR 0015). The host remounts it per opening, so every opening starts from the task.
 * Demo-local: it says so in its footer.
 */
export function TaskEditWindow({ task, open, onOpenChange, returnFocus, onSave }: TaskEditWindowProps) {
  const text = useMessages(tasksMessageKey);
  const schema = useMemo(() => taskFormSchema({ titleRequired: text.edit.titleRequired }), [text.edit.titleRequired]);

  const windowForm = useWindowForm<TaskFields, TaskFormValues>(schema, {
    defaultValues: taskToForm(task),
    submit: async (values): Promise<ActionOutcome<undefined>> => {
      onSave(values);
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
      title={text.edit.title}
      description={text.edit.description}
      returnFocus={returnFocus}
      footer={({ close }) => (
        <FormFooter
          verb={text.edit.verb}
          formId={windowForm.formProps.id}
          pending={windowForm.pending}
          error={windowForm.formError}
          onCancel={close}
        />
      )}
    >
      <form {...windowForm.formProps} className="flex flex-col gap-4">
        <FormField control={control} name="title" label={text.columns.title} readOnly={windowForm.awaiting}>
          {(field) => <Input {...field} autoComplete="off" />}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField control={control} name="status" label={text.columns.status} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {statuses.map((status) => (
                  <NativeSelectOption key={status.value} value={status.value}>
                    {text.statuses[status.value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="label" label={text.edit.label} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {labels.map((label) => (
                  <NativeSelectOption key={label.value} value={label.value}>
                    {text.labels[label.value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField control={control} name="priority" label={text.columns.priority} readOnly={windowForm.awaiting}>
            {({ readOnly, ...field }) => (
              <NativeSelect {...field} disabled={readOnly} className="w-full">
                {priorities.map((priority) => (
                  <NativeSelectOption key={priority.value} value={priority.value}>
                    {text.priorities[priority.value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            )}
          </FormField>
        </div>
      </form>
    </FormDialog>
  );
}
