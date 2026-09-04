import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ContactEditDialog } from "@/components/contacts/contact-edit-dialog";
import { ContactTagManager } from "@/components/contacts/contact-tag-manager";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!contact) {
    notFound();
  }

  const [
    { data: companies },
    { data: allTags },
    { data: assignedTagRows },
    { data: activityRows },
    members,
  ] = await Promise.all([
    supabase.from("companies").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("tags").select("id, name, color").is("deleted_at", null).order("name"),
    supabase.from("contact_tags").select("tag_id").eq("contact_id", id),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("contact_id", id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
    getOrgMemberOptions(supabase),
  ]);

  const actorIds = [
    ...new Set((activityRows ?? []).map((a) => a.actor_id).filter((v): v is string => !!v)),
  ];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", actorIds)
      : { data: [] as { id: string; email: string }[] };
  const actorEmailById = new Map((actorProfiles ?? []).map((p) => [p.id, p.email]));

  const companyName = contact.company_id
    ? (companies ?? []).find((c) => c.id === contact.company_id)?.name
    : null;
  const ownerName = contact.owner_id
    ? members.find((m) => m.id === contact.owner_id)?.name
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{contact.name}</h1>
          {companyName && (
            <p className="text-sm text-muted-foreground">{companyName}</p>
          )}
        </div>
        <div className="flex gap-2">
          <ContactEditDialog contact={contact} companies={companies ?? []} members={members} />
          <SoftDeleteButton
            table="contacts"
            id={contact.id}
            label="Contact"
            redirectTo="/contacts"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Details</h2>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{contact.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{contact.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Job title</dt>
              <dd className="text-foreground">{contact.job_title ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-foreground capitalize">{contact.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="text-foreground">{ownerName ?? "Unassigned"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Tags</h2>
            <ContactTagManager
              contactId={contact.id}
              organizationId={org.id}
              allTags={allTags ?? []}
              assignedTagIds={(assignedTagRows ?? []).map((t) => t.tag_id)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(assignedTagRows ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No tags yet.</p>
            )}
            {(assignedTagRows ?? []).map((row) => {
              const tag = (allTags ?? []).find((t) => t.id === row.tag_id);
              if (!tag) return null;
              return (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                >
                  {tag.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Activity</h2>
        <div className="mb-4">
          <AddNoteForm organizationId={org.id} parent={{ contact_id: contact.id }} />
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
