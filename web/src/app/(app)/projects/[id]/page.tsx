import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ProjectBoard } from "@/components/projects/project-board";
import { ColumnFormDialog } from "@/components/projects/column-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { PageHeader } from "@/components/ui/page-header";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!project) {
    notFound();
  }

  const [{ data: columns }, { data: todos }, members, { data: activityRows }] = await Promise.all([
    supabase
      .from("project_columns")
      .select("id, name, position")
      .eq("project_id", id)
      .order("position"),
    supabase
      .from("project_todos")
      .select("id, title, description, assigned_to, column_id, position")
      .eq("project_id", id)
      .is("deleted_at", null)
      .order("position"),
    getOrgMemberOptions(supabase),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("project_id", id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
  ]);

  const actorIds = [
    ...new Set((activityRows ?? []).map((a) => a.actor_id).filter((v): v is string => !!v)),
  ];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", actorIds)
      : { data: [] as { id: string; email: string }[] };
  const actorEmailById = new Map((actorProfiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div>
      <PageHeader
        title={project.name}
        actions={
          <>
            <ColumnFormDialog
              organizationId={org.id}
              projectId={project.id}
              nextPosition={(columns ?? []).length}
            />
            <SoftDeleteButton
              table="projects"
              id={project.id}
              label="Project"
              redirectTo="/projects"
            />
          </>
        }
      />

      <ProjectBoard
        projectId={project.id}
        organizationId={org.id}
        initialColumns={columns ?? []}
        initialTodos={todos ?? []}
        members={members}
      />

      <div className="mt-6 rounded-xl bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
          Discussion
        </h2>
        <div className="mb-5">
          <AddNoteForm organizationId={org.id} parent={{ project_id: project.id }} />
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
    </div>
  );
}
