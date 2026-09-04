import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!task) {
    notFound();
  }

  const [{ data: contacts }, { data: activityRows }] = await Promise.all([
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("deal_id", task.deal_id ?? "00000000-0000-0000-0000-000000000000")
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
  ]);

  const contactName = task.contact_id
    ? (contacts ?? []).find((c) => c.id === task.contact_id)?.name
    : null;

  const actorIds = [
    ...new Set((activityRows ?? []).map((a) => a.actor_id).filter((v): v is string => !!v)),
  ];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", actorIds)
      : { data: [] as { id: string; email: string }[] };
  const actorEmailById = new Map((actorProfiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{task.title}</h1>
          <p className="text-sm capitalize text-muted-foreground">{task.status}</p>
        </div>
        <div className="flex gap-2">
          <TaskEditDialog task={task} contacts={contacts ?? []} />
          <SoftDeleteButton table="tasks" id={task.id} label="Task" redirectTo="/tasks" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Details</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Due</dt>
            <dd className="text-foreground">
              {task.due_at ? new Date(task.due_at).toLocaleDateString() : "—"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="capitalize text-foreground">{task.priority ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Related contact</dt>
            <dd className="text-foreground">
              {contactName && task.contact_id ? (
                <Link href={`/contacts/${task.contact_id}`} className="hover:underline">
                  {contactName}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {task.description && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="text-foreground">{task.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {task.deal_id && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Deal activity</h2>
          <div className="mb-4">
            <AddNoteForm organizationId={org.id} parent={{ deal_id: task.deal_id }} />
          </div>
          <ActivityTimeline
            activities={(activityRows ?? []).map((a) => ({
              id: a.id,
              type: a.type,
              body: a.body,
              occurred_at: a.occurred_at,
              actorEmail: a.actor_id ? (actorEmailById.get(a.actor_id) ?? null) : null,
            }))}
          />
        </div>
      )}
    </div>
  );
}
