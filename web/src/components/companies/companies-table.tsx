"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SavedViewsMenu, type SavedView } from "@/components/shared/saved-views-menu";
import { createClient } from "@/lib/supabase/client";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

type SortKey = "name" | "domain" | "industry";

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
  organizationId: string;
  savedViews: SavedView[];
}

export function CompaniesTable({
  companies,
  ownerNameById,
  currentUserId,
  organizationId,
  savedViews,
}: CompaniesTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

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

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return [...filtered].sort(
      (a, b) => (a[key] ?? "").localeCompare(b[key] ?? "") * factor,
    );
  }, [filtered, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  const sortIndicator = (key: SortKey) =>
    sort?.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "";

  const allVisibleSelected =
    sorted.length > 0 && sorted.every((company) => selected.has(company.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((company) => company.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const bulkDelete = async () => {
    setIsBulkDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("companies")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", Array.from(selected));

    setIsBulkDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selected.size} compan${selected.size === 1 ? "y" : "ies"} deleted`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    router.refresh();
  };

  const currentFilters = { search, onlyMine, sort };

  const applyFilters = (filters: Record<string, unknown>) => {
    if (typeof filters.search === "string") setSearch(filters.search);
    if (typeof filters.onlyMine === "boolean") setOnlyMine(filters.onlyMine);
    const loadedSort = filters.sort as { key: SortKey; dir: "asc" | "desc" } | null | undefined;
    setSort(loadedSort ?? null);
  };

  const exportCsv = () => {
    const header = ["Name", "Domain", "Phone", "Industry", "Owner"];
    const rows = sorted.map((company) => [
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
        <SavedViewsMenu
          organizationId={organizationId}
          currentUserId={currentUserId}
          entityType="companies"
          initialViews={savedViews}
          currentFilters={currentFilters}
          onApply={applyFilters}
        />
        <Button type="button" variant="outline" onClick={exportCsv} className="ml-auto">
          Export CSV
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmBulkDelete(true)}
          >
            Delete selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} companies?</DialogTitle>
            <DialogDescription>
              This removes them from lists and searches. This can&apos;t be undone
              from the app yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={bulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAll}
                    className="size-4"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="hover:text-foreground"
                  >
                    Name{sortIndicator("name")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("domain")}
                    className="hover:text-foreground"
                  >
                    Domain{sortIndicator("domain")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("industry")}
                    className="hover:text-foreground"
                  >
                    Industry{sortIndicator("industry")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((company) => (
                <tr key={company.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(company.id)}
                      onChange={() => toggleOne(company.id)}
                      className="size-4"
                      aria-label={`Select ${company.name}`}
                    />
                  </td>
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
