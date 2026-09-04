import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { DealEditDialog } from "@/components/deals/deal-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{deal.name}</h1>
          <p className="text-sm text-muted-foreground">{stage?.name ?? "—"}</p>
        </div>
        <div className="flex gap-2">
          <DealEditDialog deal={deal} contacts={contacts ?? []} companies={companies ?? []} />
          <SoftDeleteButton table="deals" id={deal.id} label="Deal" redirectTo="/pipeline" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Details</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Value</dt>
            <dd className="text-foreground">
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: deal.currency || "USD",
              }).format(deal.value)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Contact</dt>
            <dd className="text-foreground">
              {contactName && deal.contact_id ? (
                <Link href={`/contacts/${deal.contact_id}`} className="hover:underline">
                  {contactName}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Company</dt>
            <dd className="text-foreground">
              {companyName && deal.company_id ? (
                <Link href={`/companies/${deal.company_id}`} className="hover:underline">
                  {companyName}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
          {deal.description && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Description</dt>
              <dd className="text-foreground">{deal.description}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Activity</h2>
        <div className="mb-4">
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
    </div>
  );
}
