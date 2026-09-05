import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { DealEditDialog } from "@/components/deals/deal-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { PageHeader } from "@/components/ui/page-header";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!deal) {
    notFound();
  }

  const [
    { data: stage },
    { data: contacts },
    { data: companies },
    { data: activityRows },
    members,
  ] = await Promise.all([
    supabase.from("pipeline_stages").select("name").eq("id", deal.stage_id).single(),
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("companies").select("id, name").is("deleted_at", null).order("name"),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("deal_id", id)
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

  const contactName = deal.contact_id
    ? (contacts ?? []).find((c) => c.id === deal.contact_id)?.name
    : null;
  const companyName = deal.company_id
    ? (companies ?? []).find((c) => c.id === deal.company_id)?.name
    : null;
  const ownerName = deal.owner_id
    ? members.find((m) => m.id === deal.owner_id)?.name
    : null;

  return (
    <div>
      <PageHeader
        align="start"
        title={deal.name}
        description={stage?.name ?? "—"}
        actions={
          <>
            <DealEditDialog deal={deal} contacts={contacts ?? []} companies={companies ?? []} members={members} />
            <SoftDeleteButton table="deals" id={deal.id} label="Deal" redirectTo="/pipeline" />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
            Activity
          </h2>
          <div className="mb-5">
            <AddNoteForm organizationId={org.id} parent={{ deal_id: deal.id }} />
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
          <dl className="flex flex-col gap-2">
            <Field
              label="Value"
              value={new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: deal.currency || "USD",
              }).format(deal.value)}
            />
            <Field
              label="Contact"
              value={
                contactName && deal.contact_id ? (
                  <Link href={`/contacts/${deal.contact_id}`} className="hover:underline">
                    {contactName}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Company"
              value={
                companyName && deal.company_id ? (
                  <Link href={`/companies/${deal.company_id}`} className="hover:underline">
                    {companyName}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Owner" value={ownerName ?? "Unassigned"} />
            {deal.description && <Field label="Description" value={deal.description} />}
          </dl>
        </div>
      </div>
    </div>
  );
}
