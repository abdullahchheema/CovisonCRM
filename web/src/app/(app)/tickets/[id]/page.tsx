import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { TicketEditDialog } from "@/components/tickets/ticket-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Separator } from "@/components/ui/separator";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_VARIANT,
  STATUS_LABELS,
  STATUS_VARIANT,
} from "@/components/tickets/ticket-options";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-2">{label}</dt>
      <dd className="text-right text-foreground">{value}</dd>
    </div>
  );
}

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, org } = await requireOrgContext();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!ticket) {
    notFound();
  }

  const [{ data: contacts }, members, { data: activityRows }] = await Promise.all([
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    getOrgMemberOptions(supabase),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, actor_id")
      .eq("ticket_id", id)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
  ]);

  const contactName = ticket.contact_id
    ? (contacts ?? []).find((c) => c.id === ticket.contact_id)?.name
    : null;
  const assigneeName = ticket.assigned_to
    ? members.find((m) => m.id === ticket.assigned_to)?.name
    : null;

  const actorIds = [
    ...new Set((activityRows ?? []).map((a) => a.actor_id).filter((v): v is string => !!v)),
  ];
  const { data: actorProfiles } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", actorIds)
      : { data: [] as { id: string; email: string }[] };
  const actorEmailById = new Map((actorProfiles ?? []).map((p) => [p.id, p.email]));

  return (
    <div>
      <PageHeader
        align="start"
        title={ticket.title}
        description={
          contactName ? (
            <Link href={`/contacts/${ticket.contact_id}`} className="hover:underline">
              {contactName}
            </Link>
          ) : undefined
        }
        actions={
          <>
            <TicketEditDialog ticket={ticket} contacts={contacts ?? []} members={members} />
            <SoftDeleteButton
              table="tickets"
              id={ticket.id}
              label="Ticket"
              redirectTo="/tickets"
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
            <AddNoteForm organizationId={org.id} parent={{ ticket_id: ticket.id }} />
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
              <Field label="Category" value={CATEGORY_LABELS[ticket.category] ?? ticket.category} />
              <Field
                label="Priority"
                value={
                  <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? "neutral"}>
                    {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                  </Badge>
                }
              />
              <Field
                label="Status"
                value={
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? "neutral"}>
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </Badge>
                }
              />
              <Field label="Reporter email" value={ticket.email ?? "—"} />
              <Field label="Assigned to" value={assigneeName ?? "Unassigned"} />
            </dl>
          </div>

          {ticket.description && (
            <>
              <Separator />
              <div>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-2">
                  Description
                </h2>
                <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
