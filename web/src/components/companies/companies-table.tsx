"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  phone: string | null;
  industry: string | null;
}

export function CompaniesTable({ companies }: { companies: CompanyRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter(
      (company) =>
        company.name.toLowerCase().includes(term) ||
        (company.domain ?? "").toLowerCase().includes(term) ||
        (company.industry ?? "").toLowerCase().includes(term),
    );
  }, [companies, search]);

  return (
    <div>
      <div className="mb-4">
        <Input
          placeholder="Search by name, domain, or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {companies.length === 0
              ? "No companies yet. Create your first one to start attaching contacts to it."
              : "No companies match your search."}
          </p>
        </div>
      ) : (
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
              {filtered.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/companies/${company.id}`} className="hover:underline">
                      {company.name}
                    </Link>
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
