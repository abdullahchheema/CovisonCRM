import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { CompanyEditDialog } from "@/components/companies/company-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
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
    <div>
      <PageHeader
        align="start"
        title={company.name}
        description={company.domain}
        actions={
          <>
            <CompanyEditDialog company={company} members={members} />
            <SoftDeleteButton
              table="companies"
              id={company.id}
              label="Company"
              redirectTo="/companies"
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

        <div className="flex flex-col gap-5 rounded-xl bg-surface-2 p-5">
          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Details
            </h2>
            <dl className="flex flex-col gap-2">
              <Field label="Website" value={company.website ?? "—"} />
              <Field label="Phone" value={company.phone ?? "—"} />
              <Field label="Industry" value={company.industry ?? "—"} />
              <Field label="Owner" value={ownerName ?? "Unassigned"} />
            </dl>
          </div>

          <Separator />

          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Contacts ({(contacts ?? []).length})
            </h2>
            {(contacts ?? []).length === 0 ? (
              <p className="text-sm text-text-2">No contacts at this company yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(contacts ?? []).map((contact) => (
                  <li key={contact.id} className="flex items-center justify-between text-sm">
                    <Link href={`/contacts/${contact.id}`} className="text-foreground hover:underline">
                      {contact.name}
                    </Link>
                    <span className="text-text-3">{contact.email ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
