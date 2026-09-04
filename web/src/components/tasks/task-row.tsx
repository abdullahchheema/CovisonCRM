"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

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
}

export function TaskRow({ task, contacts, contactName }: TaskRowProps) {
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
    <li className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isDone}
          onChange={toggleComplete}
          className="size-4"
        />
        <div>
          <Link
            href={`/tasks/${task.id}`}
            className={cn(
              "text-sm text-foreground hover:underline",
              isDone && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </Link>
          <div className="flex gap-2 text-xs text-muted-foreground">
            {task.due_at && <span>Due {new Date(task.due_at).toLocaleDateString()}</span>}
            {task.priority && <span className="capitalize">{task.priority}</span>}
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
