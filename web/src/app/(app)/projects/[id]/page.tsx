import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ProjectBoard } from "@/components/projects/project-board";
import { ColumnFormDialog } from "@/components/projects/column-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
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

  const [{ data: columns }, { data: todos }, members] = await Promise.all([
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
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
        <div className="flex gap-2">
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
        </div>
      </div>

      <ProjectBoard
        projectId={project.id}
        organizationId={org.id}
        initialColumns={columns ?? []}
        initialTodos={todos ?? []}
        members={members}
      />
    </div>
  );
}
