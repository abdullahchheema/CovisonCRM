import { requireOrgContext } from "@/lib/supabase/org-context";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { TasksList } from "@/components/tasks/tasks-list";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function TasksPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [{ data: tasks, error }, { data: contacts }, { data: savedViews }, members] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, priority, due_at, contact_id, assigned_to")
        .is("deleted_at", null)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
      supabase
        .from("saved_views")
        .select("id, name, filters, is_shared, user_id")
        .eq("entity_type", "tasks")
        .order("name"),
      getOrgMemberOptions(supabase),
    ]);

  const contactNameById = Object.fromEntries(
    (contacts ?? []).map((c) => [c.id, c.name]),
  );
  const memberNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));

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

      {!error && (
        <TasksList
          tasks={tasks ?? []}
          contacts={contacts ?? []}
          contactNameById={contactNameById}
          memberNameById={memberNameById}
          currentUserId={profile.id}
          organizationId={org.id}
          savedViews={savedViews ?? []}
        />
      )}
    </div>
  );
}
