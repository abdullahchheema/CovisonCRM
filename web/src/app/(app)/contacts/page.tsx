import { requireOrgContext } from "@/lib/supabase/org-context";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  connected: "Connected",
  attempted: "Attempted",
  won: "Won",
};

export default async function ContactsPage() {
  const { supabase, org } = await requireOrgContext();

  const [{ data: contacts, error }, { data: companies }] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, email, phone, job_title, status, company_id, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("companies")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
  ]);

  const companyNameById = new Map(
    (companies ?? []).map((company) => [company.id, company.name]),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
        <ContactFormDialog organizationId={org.id} companies={companies ?? []} />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && contacts?.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No contacts yet. Create your first one to get started.
          </p>
        </div>
      )}

      {!error && contacts && contacts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Job title</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {contact.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.company_id
                      ? (companyNameById.get(contact.company_id) ?? "—")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.job_title ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {STATUS_LABELS[contact.status] ?? contact.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
