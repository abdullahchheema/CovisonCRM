import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { TicketEditDialog } from "@/components/tickets/ticket-edit-dialog";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
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
  const { supabase } = await requireOrgContext();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!ticket) {
    notFound();
  }

  const [{ data: contacts }, members] = await Promise.all([
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    getOrgMemberOptions(supabase),
  ]);

  const contactName = ticket.contact_id
    ? (contacts ?? []).find((c) => c.id === ticket.contact_id)?.name
    : null;
  const assigneeName = ticket.assigned_to
    ? members.find((m) => m.id === ticket.assigned_to)?.name
    : null;

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
    </div>
  );
}
