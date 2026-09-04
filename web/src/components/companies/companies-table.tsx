"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

interface CompanyRow {
  id: string;
  name: string;
  domain: string | null;
  phone: string | null;
  industry: string | null;
  owner_id: string | null;
}

interface CompaniesTableProps {
  companies: CompanyRow[];
  ownerNameById: Record<string, string>;
  currentUserId: string;
}

export function CompaniesTable({
  companies,
  ownerNameById,
  currentUserId,
}: CompaniesTableProps) {
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return companies.filter((company) => {
      if (onlyMine && company.owner_id !== currentUserId) return false;
      if (!term) return true;
      return (
        company.name.toLowerCase().includes(term) ||
        (company.domain ?? "").toLowerCase().includes(term) ||
        (company.industry ?? "").toLowerCase().includes(term)
      );
    });
  }, [companies, search, onlyMine, currentUserId]);

  const exportCsv = () => {
    const header = ["Name", "Domain", "Phone", "Industry", "Owner"];
    const rows = filtered.map((company) => [
      company.name,
      company.domain ?? "",
      company.phone ?? "",
      company.industry ?? "",
      company.owner_id ? (ownerNameById[company.owner_id] ?? "") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `companies-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name, domain, or industry..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="size-4"
          />
          Only mine
        </label>
        <Button type="button" variant="outline" onClick={exportCsv} className="ml-auto">
          Export CSV
        </Button>
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
                <th className="px-4 py-3 font-medium">Owner</th>
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {company.owner_id ? (ownerNameById[company.owner_id] ?? "—") : "—"}
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
