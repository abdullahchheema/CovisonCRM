import { requireOrgContext } from "@/lib/supabase/org-context";
import { ContactFormDialog } from "@/components/contacts/contact-form-dialog";
import { ContactsImportDialog } from "@/components/contacts/contacts-import-dialog";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";
import { PageHeader } from "@/components/ui/page-header";

export default async function ContactsPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [
    { data: contacts, error },
    { data: companies },
    members,
    { data: tags },
    { data: savedViews },
    { data: emailTemplates },
  ] = await Promise.all([
      supabase
        .from("contacts")
        .select(
          "id, name, email, phone, job_title, status, priority, company_id, owner_id, linkedin_url, website, country, city, niche, expected_revenue, expected_close, created_at",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("companies")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
      getOrgMemberOptions(supabase),
      supabase
        .from("tags")
        .select("id, name, color")
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("saved_views")
        .select("id, name, filters, is_shared, user_id")
        .eq("entity_type", "contacts")
        .order("name"),
      supabase
        .from("email_templates")
        .select("id, name, subject")
        .is("deleted_at", null)
        .order("name"),
    ]);

  const companyNameById = Object.fromEntries(
    (companies ?? []).map((company) => [company.id, company.name]),
  );
  const ownerNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));
  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag]));

  const contactIds = (contacts ?? []).map((c) => c.id);
  const { data: contactTagRows } =
    contactIds.length > 0
      ? await supabase
          .from("contact_tags")
          .select("contact_id, tag_id")
          .in("contact_id", contactIds)
      : { data: [] as { contact_id: string; tag_id: string }[] };

  const tagsByContactId: Record<string, { id: string; name: string; color: string }[]> = {};
  for (const row of contactTagRows ?? []) {
    const tag = tagById.get(row.tag_id);
    if (!tag) continue;
    (tagsByContactId[row.contact_id] ??= []).push(tag);
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        actions={
          <>
            <ContactsImportDialog organizationId={org.id} existingCompanies={companies ?? []} />
            <ContactFormDialog organizationId={org.id} companies={companies ?? []} members={members} />
          </>
        }
      />

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (
        <ContactsTable
          contacts={contacts ?? []}
          companyNameById={companyNameById}
          ownerNameById={ownerNameById}
          currentUserId={profile.id}
          organizationId={org.id}
          tags={tags ?? []}
          tagsByContactId={tagsByContactId}
          savedViews={savedViews ?? []}
          emailTemplates={emailTemplates ?? []}
        />
      )}
    </div>
  );
}
