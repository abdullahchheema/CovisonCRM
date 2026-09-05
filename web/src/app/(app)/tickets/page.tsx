import { requireOrgContext } from "@/lib/supabase/org-context";
import { TicketFormDialog } from "@/components/tickets/ticket-form-dialog";
import { TicketsTable } from "@/components/tickets/tickets-table";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function TicketsPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [{ data: tickets, error }, { data: contacts }, members] = await Promise.all([
    supabase
      .from("tickets")
      .select("id, title, category, priority, status, contact_id, assigned_to, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
    getOrgMemberOptions(supabase),
  ]);

  const contactNameById = Object.fromEntries(
    (contacts ?? []).map((contact) => [contact.id, contact.name]),
  );
  const memberNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Tickets</h1>
        <TicketFormDialog
          organizationId={org.id}
          contacts={contacts ?? []}
          members={members}
        />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (
        <TicketsTable
          tickets={tickets ?? []}
          contactNameById={contactNameById}
          memberNameById={memberNameById}
          currentUserId={profile.id}
        />
      )}
    </div>
  );
}
