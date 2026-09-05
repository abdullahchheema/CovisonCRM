import { requireOrgContext } from "@/lib/supabase/org-context";
import { TagFormDialog } from "@/components/tags/tag-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function TagsPage() {
  const { supabase, org } = await requireOrgContext();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Tags" actions={<TagFormDialog organizationId={org.id} />} />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && tags?.length === 0 && (
        <EmptyState
          title="No tags yet"
          description="Create one to start organizing contacts."
        />
      )}

      {!error && tags && tags.length > 0 && (
        <ul className="flex flex-col divide-y divide-line-soft rounded-xl bg-surface shadow-sm">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span className="text-sm text-foreground">{tag.name}</span>
              <SoftDeleteButton table="tags" id={tag.id} label="Tag" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
