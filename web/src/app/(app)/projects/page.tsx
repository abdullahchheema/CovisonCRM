import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export default async function ProjectsPage() {
  const { supabase, org } = await requireOrgContext();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <ProjectFormDialog organizationId={org.id} />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (projects ?? []).length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No projects yet. Create one to start a board.
          </p>
        </div>
      )}

      {!error && (projects ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-xl border border-border bg-surface p-4 hover:bg-muted/40"
            >
              <p className="font-medium text-foreground">{project.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
