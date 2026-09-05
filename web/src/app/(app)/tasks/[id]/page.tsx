import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { PageHeader } from "@/components/ui/page-header";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

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

  const details = (
    <dl className="flex flex-col gap-2">
      <Field
        label="Due"
        value={task.due_at ? new Date(task.due_at).toLocaleDateString() : "—"}
      />
      <Field label="Priority" value={<span className="capitalize">{task.priority ?? "—"}</span>} />
      <Field
        label="Related contact"
        value={
          contactName && task.contact_id ? (
            <Link href={`/contacts/${task.contact_id}`} className="hover:underline">
              {contactName}
            </Link>
          ) : (
            "—"
          )
        }
      />
      {task.description && <Field label="Description" value={task.description} />}
    </dl>
  );

  return (
    <div>
      <PageHeader
        align="start"
        title={task.title}
        description={<span className="capitalize">{task.status}</span>}
        actions={
          <>
            <TaskEditDialog task={task} contacts={contacts ?? []} />
            <SoftDeleteButton table="tasks" id={task.id} label="Task" redirectTo="/tasks" />
          </>
        }
      />

      {task.deal_id ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-xl bg-surface p-6 shadow-sm">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
              Deal activity
            </h2>
            <div className="mb-5">
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

          <div className="rounded-xl bg-surface-2 p-5">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Details
            </h2>
            {details}
          </div>
        </div>
      ) : (
        <div className="max-w-md rounded-xl bg-surface-2 p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
            Details
          </h2>
          {details}
        </div>
      )}
    </div>
  );
}
