import { requireOrgContext } from "@/lib/supabase/org-context";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TaskRow } from "@/components/tasks/task-row";

export default async function TasksPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [{ data: tasks, error }, { data: contacts }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_at, contact_id")
      .is("deleted_at", null)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
  ]);

  const contactNameById = new Map((contacts ?? []).map((c) => [c.id, c.name]));
  const open = (tasks ?? []).filter((t) => t.status !== "completed");
  const completed = (tasks ?? []).filter((t) => t.status === "completed");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
        <TaskFormDialog
          organizationId={org.id}
          assignedTo={profile.id}
          contacts={contacts ?? []}
        />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (tasks ?? []).length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks yet. Create one to get started.
          </p>
        </div>
      )}

      {open.length > 0 && (
        <ul className="flex flex-col gap-2">
          {open.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              contactName={task.contact_id ? (contactNameById.get(task.contact_id) ?? null) : null}
            />
          ))}
        </ul>
      )}

      {completed.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Completed</h2>
          <ul className="flex flex-col gap-2">
            {completed.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                contactName={task.contact_id ? (contactNameById.get(task.contact_id) ?? null) : null}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
