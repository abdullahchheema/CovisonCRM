import { useState } from "react";
import { Button } from "@/components/ui/button";
import { emptyTask } from "../helpers";
import CardFields from "./CardFields";
import type { Todo, TodoFields } from "../types";

interface AddTaskFormProps {
  onSubmit: (
    todo: Omit<Todo, "_id" | "date" | "projectId" | "columnId">,
  ) => void;
  onCancel: () => void;
}

const AddTaskForm = ({ onSubmit, onCancel }: AddTaskFormProps) => {
  const [values, setValues] = useState<TodoFields>(emptyTask);
  const [error, setError] = useState("");

  const change = (patch: Partial<TodoFields>) =>
    setValues((prev) => ({ ...prev, ...patch }));

  const submit = () => {
    if (values.title.trim().length < 3) {
      setError("Title is too short");
      return;
    }
    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      author: values.author,
      label: values.label.trim(),
      labelColor: values.labelColor,
      priority: values.priority,
      dueDate: values.dueDate,
      estimatedDuration: values.estimatedDuration.trim(),
    });
  };

  return (
    <div className="rounded-lg border bg-card p-3 shadow-sm">
      <CardFields
        value={values}
        onChange={change}
        onSubmit={submit}
        onCancel={onCancel}
        titleError={error}
      />
      <div className="flex gap-2 justify-end w-full mt-2.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" variant="outline" onClick={submit}>
          Add
        </Button>
      </div>
    </div>
  );
};

export default AddTaskForm;
