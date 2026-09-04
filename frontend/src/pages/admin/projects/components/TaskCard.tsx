import { useState } from "react";
import { CalendarDays, AlertTriangle, Timer } from "lucide-react";
import { DragHandle } from "@/components/custom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RowActionsMenu } from "./RowActionsMenu";
import { AuthorAvatar, PriorityIndicator } from "@/components/common";
import CustomBadge, { badgeVariants } from "@/components/custom/CustomBadge";
import { type VariantProps } from "class-variance-authority";
import CardFields from "./CardFields";
import { accentForColor } from "../helpers";
import type { Todo, TodoFields } from "../types";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

interface TaskCardProps {
  todo: Todo;
  provided: any;
  isDragging: boolean;
  onDelete: () => void;
  onEdit: (updates: TodoFields) => void;
}

const toFields = (todo: Todo): TodoFields => ({
  title: todo.title,
  description: todo.description,
  author: todo.author,
  label: todo.label ?? "",
  labelColor: todo.labelColor || "primary",
  priority: todo.priority ?? "",
  dueDate: todo.dueDate ?? "",
  estimatedDuration: todo.estimatedDuration ?? "",
});

const TaskCard = ({
  todo,
  provided,
  isDragging,
  onDelete,
  onEdit,
}: TaskCardProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TodoFields>(toFields(todo));
  const [error, setError] = useState("");

  const change = (patch: Partial<TodoFields>) =>
    setDraft((prev) => ({ ...prev, ...patch }));

  const save = () => {
    if (draft.title.trim().length < 3) {
      setError("Title is too short");
      return;
    }
    onEdit({
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      label: draft.label.trim(),
    });
    setEditing(false);
  };

  const cancel = () => {
    setDraft(toFields(todo));
    setError("");
    setEditing(false);
  };

  // Overdue when a due date is set, in the past — only meaningful while open.
  const dueDate = todo.dueDate ? new Date(todo.dueDate + "T00:00:00") : null;
  const overdue =
    dueDate !== null &&
    !isNaN(dueDate.getTime()) &&
    dueDate.getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <Card
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{ ...provided.draggableProps.style }}
      className={cn(
        "p-3 group transition-shadow border-l-4",
        accentForColor(todo.labelColor),
        isDragging && "shadow-lg ring-2 ring-primary/40",
      )}
    >
      {editing ? (
        <>
          <CardFields
            value={draft}
            onChange={change}
            onSubmit={save}
            onCancel={cancel}
            titleError={error}
          />
          <div className="flex gap-2 justify-end w-full mt-2.5">
            <Button size="sm" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" variant="outline" onClick={save}>
              Save
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-2">
            <DragHandle
              dragHandleProps={provided.dragHandleProps}
              className="mt-0.5"
            />
            <p className="text-sm font-medium leading-snug flex-1">
              {todo.title}
            </p>
            <RowActionsMenu
              onEdit={() => setEditing(true)}
              onDelete={onDelete}
              triggerClassName="opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            />
          </div>

          {todo.label && (
            <div className="ml-5 mb-2">
              <CustomBadge variant={(todo.labelColor as BadgeVariant) || "primary"}>
                {todo.label}
              </CustomBadge>
            </div>
          )}

          {todo.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 ml-5 mb-2">
              {todo.description}
            </p>
          )}

          {(todo.dueDate || todo.priority || todo.estimatedDuration) && (
            <div className="flex items-center gap-2 ml-5 mb-2 flex-wrap">
              {todo.dueDate && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                    overdue
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {overdue ? (
                    <AlertTriangle className="size-3" />
                  ) : (
                    <CalendarDays className="size-3" />
                  )}
                  {new Date(todo.dueDate + "T00:00:00").toLocaleDateString(
                    undefined,
                    { month: "short", day: "numeric" },
                  )}
                </span>
              )}
              {todo.priority && (
                <PriorityIndicator value={todo.priority} className="text-[11px]" />
              )}
              {todo.estimatedDuration && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Timer className="size-3" />
                  {todo.estimatedDuration}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between ml-5">
            <div className="flex items-center gap-1.5">
              <AuthorAvatar name={todo.author.name} image={todo.author.image} />
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {todo.author.name}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(todo.date).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </>
      )}
    </Card>
  );
};

export default TaskCard;
