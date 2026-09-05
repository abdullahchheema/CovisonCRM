"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const PRIORITY_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  low: "neutral",
  medium: "info",
  high: "warning",
};

interface TaskRowProps {
  task: {
    id: string;
    title: string;
    status: string;
    priority: string | null;
    due_at: string | null;
    contact_id: string | null;
  };
  contacts: { id: string; name: string }[];
  contactName: string | null;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function TaskRow({
  task,
  contacts,
  contactName,
  selected,
  onToggleSelect,
}: TaskRowProps) {
  const router = useRouter();
  const isDone = task.status === "completed";

  const toggleComplete = async () => {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({
        status: isDone ? "open" : "completed",
        completed_at: isDone ? null : new Date().toISOString(),
      })
      .eq("id", task.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <li className="flex items-center justify-between gap-4 rounded-xl bg-surface px-4 py-3 shadow-xs">
      <div className="flex items-center gap-3">
        {onToggleSelect && (
          <Checkbox
            checked={selected ?? false}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${task.title}`}
          />
        )}
        <Checkbox
          checked={isDone}
          onCheckedChange={toggleComplete}
          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        />
        <div>
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              "text-sm text-foreground hover:underline",
              isDone && "text-text-3 line-through",
            )}
          >
            {task.title}
          </Link>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-text-3">
            {task.due_at && <span>Due {new Date(task.due_at).toLocaleDateString()}</span>}
            {task.priority && (
              <Badge variant={PRIORITY_VARIANT[task.priority] ?? "neutral"}>{task.priority}</Badge>
            )}
            {contactName && task.contact_id && (
              <Link href={`/contacts/${task.contact_id}`} className="hover:underline">
                {contactName}
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <TaskEditDialog task={task} contacts={contacts} />
        <SoftDeleteButton table="tasks" id={task.id} label="Task" />
      </div>
    </li>
  );
}
