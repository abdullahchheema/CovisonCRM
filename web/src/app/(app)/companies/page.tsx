import { requireOrgContext } from "@/lib/supabase/org-context";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { CompaniesImportDialog } from "@/components/companies/companies-import-dialog";
import { CompaniesTable } from "@/components/companies/companies-table";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function CompaniesPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const [{ data: companies, error }, members, { data: savedViews }] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, domain, website, phone, industry, owner_id, created_at")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getOrgMemberOptions(supabase),
    supabase
      .from("saved_views")
      .select("id, name, filters, is_shared, user_id")
      .eq("entity_type", "companies")
      .order("name"),
  ]);

  const ownerNameById = Object.fromEntries(members.map((m) => [m.id, m.name]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Companies</h1>
        <div className="flex gap-2">
          <CompaniesImportDialog organizationId={org.id} />
          <CompanyFormDialog organizationId={org.id} members={members} />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (
        <CompaniesTable
          companies={companies ?? []}
          ownerNameById={ownerNameById}
          currentUserId={profile.id}
          organizationId={org.id}
          savedViews={savedViews ?? []}
        />
      )}
    </div>
  );
}
