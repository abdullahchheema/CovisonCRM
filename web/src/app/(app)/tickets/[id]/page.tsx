import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { TicketEditDialog } from "@/components/tickets/ticket-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { AddNoteForm } from "@/components/shared/add-note-form";
import { ActivityTimeline } from "@/components/shared/activity-timeline";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/components/tickets/ticket-options";

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
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{ticket.title}</h1>
          {contactName && (
            <Link
              href={`/contacts/${ticket.contact_id}`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {contactName}
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          <TicketEditDialog ticket={ticket} contacts={contacts ?? []} members={members} />
          <SoftDeleteButton
            table="tickets"
            id={ticket.id}
            label="Ticket"
            redirectTo="/tickets"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Details</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="text-foreground">{CATEGORY_LABELS[ticket.category] ?? ticket.category}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Priority</dt>
            <dd className="text-foreground">{PRIORITY_LABELS[ticket.priority] ?? ticket.priority}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{STATUS_LABELS[ticket.status] ?? ticket.status}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Reporter email</dt>
            <dd className="text-foreground">{ticket.email ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Assigned to</dt>
            <dd className="text-foreground">{assigneeName ?? "Unassigned"}</dd>
          </div>
        </dl>
        {ticket.description && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-1 text-sm text-muted-foreground">Description</p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{ticket.description}</p>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-foreground">Activity</h2>
        <div className="mb-4">
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
    </div>
  );
}
