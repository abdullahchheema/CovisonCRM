import { requireOrgContext } from "@/lib/supabase/org-context";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";
import { CompaniesTable } from "@/components/companies/companies-table";

export default async function CompaniesPage() {
  const { supabase, org } = await requireOrgContext();

  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, domain, website, phone, industry, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Companies</h1>
        <CompanyFormDialog organizationId={org.id} />
      </div>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && <CompaniesTable companies={companies ?? []} />}
    </div>
  );
}
