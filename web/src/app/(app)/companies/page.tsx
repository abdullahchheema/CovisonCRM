import { requireOrgContext } from "@/lib/supabase/org-context";
import { CompanyFormDialog } from "@/components/companies/company-form-dialog";

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

      {!error && companies?.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No companies yet. Create your first one to start attaching
            contacts to it.
          </p>
        </div>
      )}

      {!error && companies && companies.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Industry</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {company.domain ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {company.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {company.industry ?? "—"}
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
