"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
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
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
  PRIORITY_LABELS,
  PRIORITY_OPTIONS,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "./ticket-options";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const PRIORITY_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  open: "info",
  inProgress: "brand",
  onHold: "warning",
  resolved: "success",
  closed: "neutral",
};

interface TicketRow {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  contact_id: string | null;
  assigned_to: string | null;
  created_at: string;
}

interface TicketsTableProps {
  tickets: TicketRow[];
  contactNameById: Record<string, string>;
  memberNameById: Record<string, string>;
  currentUserId: string;
  organizationId: string;
  savedViews: SavedView[];
}

export function TicketsTable({
  tickets,
  contactNameById,
  memberNameById,
  currentUserId,
  organizationId,
  savedViews,
}: TicketsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (onlyMine && ticket.assigned_to !== currentUserId) return false;
      if (status && ticket.status !== status) return false;
      if (priority && ticket.priority !== priority) return false;
      if (category && ticket.category !== category) return false;
      if (!term) return true;
      return ticket.title.toLowerCase().includes(term);
    });
  }, [tickets, search, status, priority, category, onlyMine, currentUserId]);

  const currentFilters = { search, status, priority, category, onlyMine };

  const applyFilters = (filters: Record<string, unknown>) => {
    if (typeof filters.search === "string") setSearch(filters.search);
    if (typeof filters.status === "string") setStatus(filters.status);
    if (typeof filters.priority === "string") setPriority(filters.priority);
    if (typeof filters.category === "string") setCategory(filters.category);
    if (typeof filters.onlyMine === "boolean") setOnlyMine(filters.onlyMine);
  };

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((ticket) => selected.has(ticket.id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((ticket) => ticket.id)));
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
      .from("tickets")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", Array.from(selected));

    setIsBulkDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selected.size} ticket${selected.size === 1 ? "" : "s"} deleted`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    router.refresh();
  };

  const exportCsv = () => {
    const header = ["Title", "Contact", "Category", "Priority", "Status", "Assigned to"];
    const rows = filtered.map((ticket) => [
      ticket.title,
      ticket.contact_id ? (contactNameById[ticket.contact_id] ?? "") : "",
      CATEGORY_LABELS[ticket.category] ?? ticket.category,
      PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
      STATUS_LABELS[ticket.status] ?? ticket.status,
      ticket.assigned_to ? (memberNameById[ticket.assigned_to] ?? "") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-40">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="max-w-40"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="max-w-40"
        >
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
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
          entityType="tickets"
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
            <DialogTitle>Delete {selected.size} tickets?</DialogTitle>
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
        <EmptyState
          title={tickets.length === 0 ? "No tickets yet" : "No tickets match your filters"}
          description={tickets.length === 0 ? "Create one to get started." : undefined}
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
              <TableHead>Title</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned to</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(ticket.id)}
                    onCheckedChange={() => toggleOne(ticket.id)}
                    aria-label={`Select ${ticket.title}`}
                  />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                    {ticket.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {ticket.contact_id ? (contactNameById[ticket.contact_id] ?? "—") : "—"}
                </TableCell>
                <TableCell>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANT[ticket.priority] ?? "neutral"}>
                    {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? "neutral"}>
                    {STATUS_LABELS[ticket.status] ?? ticket.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {ticket.assigned_to ? (memberNameById[ticket.assigned_to] ?? "—") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
