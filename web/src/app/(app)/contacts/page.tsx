import { requireOrgContext } from "@/lib/supabase/org-context";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";

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

  const companyNameById = Object.fromEntries(
    (companies ?? []).map((company) => [company.id, company.name]),
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Contacts</h1>
        <ContactFormDialog organizationId={org.id} companies={companies ?? []} />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (
        <ContactsTable contacts={contacts ?? []} companyNameById={companyNameById} />
      )}
    </div>
  );
}
