"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SavedViewsMenu, type SavedView } from "@/components/shared/saved-views-menu";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, PRIORITY_LABELS, PRIORITY_OPTIONS, STATUS_LABELS, STATUS_OPTIONS } from "./ticket-options";

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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

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

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
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
          entityType="tickets"
          initialViews={savedViews}
          currentFilters={currentFilters}
          onApply={applyFilters}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tickets.length === 0
              ? "No tickets yet. Create one to get started."
              : "No tickets match your filters."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned to</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/tickets/${ticket.id}`} className="hover:underline">
                      {ticket.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.contact_id ? (contactNameById[ticket.contact_id] ?? "—") : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">
                      {STATUS_LABELS[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.assigned_to ? (memberNameById[ticket.assigned_to] ?? "—") : "—"}
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
