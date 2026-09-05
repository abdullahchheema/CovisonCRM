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
import { Select } from "@/components/ui/select";
import { SavedViewsMenu, type SavedView } from "@/components/shared/saved-views-menu";
import { createClient } from "@/lib/supabase/client";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  connected: "Connected",
  attempted: "Attempted",
  won: "Won",
};

interface ContactRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  status: string;
  company_id: string | null;
  owner_id: string | null;
}

type SortKey = "name" | "email" | "job_title" | "status";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ContactsTableProps {
  contacts: ContactRow[];
  companyNameById: Record<string, string>;
  ownerNameById: Record<string, string>;
  currentUserId: string;
  organizationId: string;
  tags: Tag[];
  tagsByContactId: Record<string, Tag[]>;
  savedViews: SavedView[];
}

export function ContactsTable({
  contacts,
  companyNameById,
  ownerNameById,
  currentUserId,
  organizationId,
  tags,
  tagsByContactId,
  savedViews,
}: ContactsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkTagOpen, setBulkTagOpen] = useState(false);
  const [bulkTagId, setBulkTagId] = useState("");
  const [isBulkTagging, setIsBulkTagging] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (onlyMine && contact.owner_id !== currentUserId) return false;
      if (status && contact.status !== status) return false;
      if (tagFilter && !(tagsByContactId[contact.id] ?? []).some((tag) => tag.id === tagFilter)) {
        return false;
      }
      if (!term) return true;
      return (
        contact.name.toLowerCase().includes(term) ||
        (contact.email ?? "").toLowerCase().includes(term) ||
        (contact.job_title ?? "").toLowerCase().includes(term)
      );
    });
  }, [contacts, search, status, tagFilter, tagsByContactId, onlyMine, currentUserId]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const aValue = key === "status" ? (STATUS_LABELS[a.status] ?? a.status) : (a[key] ?? "");
      const bValue = key === "status" ? (STATUS_LABELS[b.status] ?? b.status) : (b[key] ?? "");
      return aValue.localeCompare(bValue) * factor;
    });
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
    sorted.length > 0 && sorted.every((contact) => selected.has(contact.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((contact) => contact.id)));
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
      .from("contacts")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", Array.from(selected));

    setIsBulkDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selected.size} contact${selected.size === 1 ? "" : "s"} deleted`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    router.refresh();
  };

  const bulkAddTag = async () => {
    if (!bulkTagId) return;
    setIsBulkTagging(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("contact_tags")
      .upsert(
        Array.from(selected).map((contactId) => ({
          contact_id: contactId,
          tag_id: bulkTagId,
          organization_id: organizationId,
        })),
        { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
      );

    setIsBulkTagging(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const tagName = tags.find((t) => t.id === bulkTagId)?.name ?? "Tag";
    toast.success(`${tagName} added to ${selected.size} contact${selected.size === 1 ? "" : "s"}`);
    setBulkTagOpen(false);
    setBulkTagId("");
    router.refresh();
  };

  const currentFilters = {
    search,
    status,
    tagFilter,
    onlyMine,
    sort,
  };

  const applyFilters = (filters: Record<string, unknown>) => {
    if (typeof filters.search === "string") setSearch(filters.search);
    if (typeof filters.status === "string") setStatus(filters.status);
    if (typeof filters.tagFilter === "string") setTagFilter(filters.tagFilter);
    if (typeof filters.onlyMine === "boolean") setOnlyMine(filters.onlyMine);
    const loadedSort = filters.sort as { key: SortKey; dir: "asc" | "desc" } | null | undefined;
    setSort(loadedSort ?? null);
  };

  const exportCsv = () => {
    const header = ["Name", "Email", "Phone", "Job title", "Status", "Tags", "Company", "Owner"];
    const rows = sorted.map((contact) => [
      contact.name,
      contact.email ?? "",
      contact.phone ?? "",
      contact.job_title ?? "",
      STATUS_LABELS[contact.status] ?? contact.status,
      (tagsByContactId[contact.id] ?? []).map((tag) => tag.name).join("; "),
      contact.company_id ? (companyNameById[contact.company_id] ?? "") : "",
      contact.owner_id ? (ownerNameById[contact.owner_id] ?? "") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Input
          placeholder="Search by name, email, or job title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="max-w-40"
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="max-w-40"
        >
          <option value="">All tags</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </Select>
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
          entityType="contacts"
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
            variant="outline"
            size="sm"
            onClick={() => setBulkTagOpen(true)}
            disabled={tags.length === 0}
          >
            Add tag
          </Button>
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
            <DialogTitle>Delete {selected.size} contacts?</DialogTitle>
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

      <Dialog open={bulkTagOpen} onOpenChange={setBulkTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add tag to {selected.size} contacts</DialogTitle>
          </DialogHeader>
          <Select value={bulkTagId} onChange={(e) => setBulkTagId(e.target.value)}>
            <option value="">Select a tag...</option>
            {tags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkTagOpen(false)}>
              Cancel
            </Button>
            <Button onClick={bulkAddTag} disabled={isBulkTagging || !bulkTagId}>
              {isBulkTagging ? "Adding..." : "Add tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {contacts.length === 0
              ? "No contacts yet. Create your first one to get started."
              : "No contacts match your search."}
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
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("email")}
                    className="hover:text-foreground"
                  >
                    Email{sortIndicator("email")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("job_title")}
                    className="hover:text-foreground"
                  >
                    Job title{sortIndicator("job_title")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="hover:text-foreground"
                  >
                    Status{sortIndicator("status")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(contact.id)}
                      onChange={() => toggleOne(contact.id)}
                      className="size-4"
                      aria-label={`Select ${contact.name}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/contacts/${contact.id}`} className="hover:underline">
                      {contact.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.company_id
                      ? (companyNameById[contact.company_id] ?? "—")
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(tagsByContactId[contact.id] ?? []).map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {contact.owner_id ? (ownerNameById[contact.owner_id] ?? "—") : "—"}
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
