import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ContactEditDialog } from "@/components/contacts/contact-edit-dialog";
import { ContactTagManager } from "@/components/contacts/contact-tag-manager";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

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
  const contactTags = (assignedTagRows ?? [])
    .map((row) => (allTags ?? []).find((t) => t.id === row.tag_id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  return (
    <div>
      <PageHeader
        align="start"
        title={contact.name}
        description={companyName}
        actions={
          <>
            <ContactEditDialog contact={contact} companies={companies ?? []} members={members} />
            <SoftDeleteButton
              table="contacts"
              id={contact.id}
              label="Contact"
              redirectTo="/contacts"
            />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
            Activity
          </h2>
          <div className="mb-5">
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

        <div className="flex flex-col gap-5 rounded-xl bg-surface-2 p-5">
          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Details
            </h2>
            <dl className="flex flex-col gap-2">
              <Field label="Email" value={contact.email ?? "—"} />
              <Field label="Phone" value={contact.phone ?? "—"} />
              <Field label="Job title" value={contact.job_title ?? "—"} />
              <Field label="Status" value={<span className="capitalize">{contact.status}</span>} />
              <Field label="Owner" value={ownerName ?? "Unassigned"} />
              <Field label="Priority" value={<span className="capitalize">{contact.priority ?? "—"}</span>} />
              <Field
                label="City / Country"
                value={[contact.city, contact.country].filter(Boolean).join(", ") || "—"}
              />
              <Field label="Niche" value={contact.niche ?? "—"} />
              <Field
                label="Website"
                value={
                  contact.website ? (
                    <a href={contact.website} target="_blank" rel="noreferrer" className="hover:underline">
                      {contact.website}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <Field
                label="LinkedIn"
                value={
                  contact.linkedin_url ? (
                    <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="hover:underline">
                      Profile
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </dl>
          </div>

          <Separator />

          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Lead details
            </h2>
            <dl className="flex flex-col gap-2">
              <Field
                label="Expected revenue"
                value={
                  contact.expected_revenue != null
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                      }).format(contact.expected_revenue)
                    : "—"
                }
              />
              <Field
                label="Expected close"
                value={
                  contact.expected_close
                    ? new Date(contact.expected_close).toLocaleDateString()
                    : "—"
                }
              />
              <Field
                label="Probability"
                value={
                  contact.probability ? `${Math.round(Number(contact.probability) * 100)}%` : "—"
                }
              />
            </dl>
          </div>

          <Separator />

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-medium uppercase tracking-wide text-text-2">Tags</h2>
              <ContactTagManager
                contactId={contact.id}
                organizationId={org.id}
                allTags={allTags ?? []}
                assignedTagIds={(assignedTagRows ?? []).map((t) => t.tag_id)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contactTags.length === 0 && <p className="text-sm text-text-2">No tags yet.</p>}
              {contactTags.map((tag) => (
                <Badge key={tag.id} variant="neutral">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
