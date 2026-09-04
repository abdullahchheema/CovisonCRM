"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

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

interface ContactsTableProps {
  contacts: ContactRow[];
  companyNameById: Record<string, string>;
  ownerNameById: Record<string, string>;
}

export function ContactsTable({ contacts, companyNameById, ownerNameById }: ContactsTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (status && contact.status !== status) return false;
      if (!term) return true;
      return (
        contact.name.toLowerCase().includes(term) ||
        (contact.email ?? "").toLowerCase().includes(term) ||
        (contact.job_title ?? "").toLowerCase().includes(term)
      );
    });
  }, [contacts, search, status]);

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
      </div>

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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Job title</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((contact) => (
                <tr key={contact.id} className="border-b border-border last:border-0">
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
