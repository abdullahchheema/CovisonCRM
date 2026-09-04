import { requireOrgContext } from "@/lib/supabase/org-context";
import { TagFormDialog } from "@/components/tags/tag-form-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";

export default async function TagsPage() {
  const { supabase, org } = await requireOrgContext();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name, color")
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Tags</h1>
        <TagFormDialog organizationId={org.id} />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && tags?.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No tags yet. Create one to start organizing contacts.
          </p>
        </div>
      )}

      {!error && tags && tags.length > 0 && (
        <ul className="flex flex-col gap-2">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
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
