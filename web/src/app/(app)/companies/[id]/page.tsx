import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { CompanyEditDialog } from "@/components/companies/company-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!company) {
    notFound();
  }

  const [{ data: contacts }, { data: activityRows }, members] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, status")
      .eq("company_id", id)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("company_id", id)
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
  const ownerName = company.owner_id
    ? members.find((m) => m.id === company.owner_id)?.name
    : null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{company.name}</h1>
          {company.domain && (
            <p className="text-sm text-muted-foreground">{company.domain}</p>
          )}
        </div>
        <div className="flex gap-2">
          <CompanyEditDialog company={company} members={members} />
          <SoftDeleteButton
            table="companies"
            id={company.id}
            label="Company"
            redirectTo="/companies"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Details</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Website</dt>
            <dd className="text-foreground">{company.website ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="text-foreground">{company.phone ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Industry</dt>
            <dd className="text-foreground">{company.industry ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="text-foreground">{ownerName ?? "Unassigned"}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Contacts ({(contacts ?? []).length})
        </h2>
        {(contacts ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No contacts at this company yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(contacts ?? []).map((contact) => (
              <li key={contact.id} className="flex items-center justify-between text-sm">
                <Link href={`/contacts/${contact.id}`} className="text-foreground hover:underline">
                  {contact.name}
                </Link>
                <span className="text-muted-foreground">{contact.email ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Activity</h2>
        <div className="mb-4">
          <AddNoteForm organizationId={org.id} parent={{ company_id: company.id }} />
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
