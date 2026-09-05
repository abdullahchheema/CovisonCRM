"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Tag as TagIcon, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

// A status's job here is state, not identity — the semantic colors, not a
// categorical palette.
const STATUS_VARIANT: Record<string, "info" | "brand" | "warning" | "success"> = {
  new: "info",
  qualified: "brand",
  connected: "brand",
  attempted: "warning",
  won: "success",
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
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
        <label className="flex items-center gap-2 text-sm text-text-2">
          <Checkbox checked={onlyMine} onCheckedChange={(v) => setOnlyMine(v === true)} />
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
          <Download /> Export CSV
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-brand-soft px-4 py-2">
          <span className="text-sm font-medium text-primary">{selected.size} selected</span>
          <Button
            type="button"
            variant="soft"
            size="sm"
            onClick={() => setBulkTagOpen(true)}
            disabled={tags.length === 0}
          >
            <TagIcon /> Add tag
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmBulkDelete(true)}
          >
            <Trash2 /> Delete selected
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
        <EmptyState
          title={contacts.length === 0 ? "No contacts yet" : "No contacts match your search"}
          description={
            contacts.length === 0 ? "Create your first one to get started." : undefined
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("name")} className="hover:text-foreground">
                  Name{sortIndicator("name")}
                </button>
              </TableHead>
              <TableHead>Company</TableHead>
              <TableHead>
                <button type="button" onClick={() => toggleSort("email")} className="hover:text-foreground">
                  Email{sortIndicator("email")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("job_title")}
                  className="hover:text-foreground"
                >
                  Job title{sortIndicator("job_title")}
                </button>
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => toggleSort("status")}
                  className="hover:text-foreground"
                >
                  Status{sortIndicator("status")}
                </button>
              </TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(contact.id)}
                    onCheckedChange={() => toggleOne(contact.id)}
                    aria-label={`Select ${contact.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/contacts/${contact.id}`} className="hover:underline">
                    {contact.name}
                  </Link>
                </TableCell>
                <TableCell>
                  {contact.company_id ? (companyNameById[contact.company_id] ?? "—") : "—"}
                </TableCell>
                <TableCell>{contact.email ?? "—"}</TableCell>
                <TableCell>{contact.job_title ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[contact.status] ?? "neutral"}>
                    {STATUS_LABELS[contact.status] ?? contact.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {(tagsByContactId[contact.id] ?? []).map((tag) => (
                      <Badge key={tag.id} variant="neutral">
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {contact.owner_id ? (ownerNameById[contact.owner_id] ?? "—") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
