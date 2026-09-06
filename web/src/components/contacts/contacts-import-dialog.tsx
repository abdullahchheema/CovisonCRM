"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

// A professional import needs a hard ceiling. The legacy app's CSV import
// was fully synchronous with no size limit at all. 1000 rows keeps a single
// import well within one request's reasonable latency; larger lists should
// be split, which the error message says explicitly rather than hanging.
const MAX_ROWS = 1000;
const VALID_STATUSES = new Set(["new", "qualified", "connected", "attempted", "won"]);
const VALID_PRIORITIES = new Set(["low", "medium", "high", "veryHigh"]);

const TARGET_FIELDS = [
  { value: "", label: "Ignore this column" },
  { value: "name", label: "Name (required)" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "job_title", label: "Job title" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
  { value: "priority", label: "Priority" },
] as const;

type TargetField = (typeof TARGET_FIELDS)[number]["value"];

interface ParsedRow {
  index: number;
  values: Record<TargetField, string>;
  errors: string[];
}

interface ContactsImportDialogProps {
  organizationId: string;
  existingCompanies: { id: string; name: string }[];
}

function guessMapping(header: string): TargetField {
  const normalized = header.trim().toLowerCase();
  const match = TARGET_FIELDS.find(
    (f) => f.value && (normalized === f.value || normalized.replace(/[\s_]/g, "") === f.value.replace(/_/g, "")),
  );
  if (match) return match.value;
  if (normalized.includes("email")) return "email";
  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("company")) return "company";
  if (normalized.includes("title") || normalized.includes("role")) return "job_title";
  if (normalized.includes("status")) return "status";
  if (normalized.includes("priority")) return "priority";
  if (normalized.includes("name")) return "name";
  return "";
}

export function ContactsImportDialog({
  organizationId,
  existingCompanies,
}: ContactsImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "importing" | "done">("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, TargetField>>({});
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setMapping({});
    setResult(null);
  };

  const handleFile = (file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > MAX_ROWS) {
          toast.error(
            `This file has more than ${MAX_ROWS} rows. Split it into smaller files and import each separately.`,
          );
          return;
        }
        const csvHeaders = results.meta.fields ?? [];
        const initialMapping: Record<string, TargetField> = {};
        for (const header of csvHeaders) {
          initialMapping[header] = guessMapping(header);
        }
        setHeaders(csvHeaders);
        setRawRows(results.data);
        setMapping(initialMapping);
        setStep("mapping");
      },
      error: (err) => {
        toast.error(err.message);
      },
    });
  };

  const buildParsedRows = (): ParsedRow[] => {
    const nameHeader = headers.find((h) => mapping[h] === "name");

    return rawRows.map((row, index) => {
      const values = {} as Record<TargetField, string>;
      for (const header of headers) {
        const field = mapping[header];
        if (field) values[field] = (row[header] ?? "").trim();
      }

      const errors: string[] = [];
      if (!nameHeader || !values.name) {
        errors.push("Name is required");
      }
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.push("Invalid email");
      }
      if (values.status && !VALID_STATUSES.has(values.status)) {
        errors.push(`Unknown status "${values.status}"`);
      }
      if (values.priority && !VALID_PRIORITIES.has(values.priority)) {
        errors.push(`Unknown priority "${values.priority}"`);
      }

      return { index, values, errors };
    });
  };

  const parsedRows = step === "mapping" || step === "importing" ? buildParsedRows() : [];
  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    setStep("importing");
    const supabase = createClient();

    // Resolve companies: create any mapped company name that doesn't
    // already exist, one insert for the whole missing set rather than one
    // request per row.
    const existingByLowerName = new Map(
      existingCompanies.map((c) => [c.name.trim().toLowerCase(), c.id]),
    );
    const neededNames = [
      ...new Set(
        validRows
          .map((r) => r.values.company)
          .filter((name): name is string => !!name)
          .filter((name) => !existingByLowerName.has(name.toLowerCase())),
      ),
    ];

    if (neededNames.length > 0) {
      const { data: created, error: companyError } = await supabase
        .from("companies")
        .insert(neededNames.map((name) => ({ organization_id: organizationId, name })))
        .select("id, name");

      if (companyError) {
        toast.error(`Could not create companies: ${companyError.message}`);
        setStep("mapping");
        return;
      }
      for (const company of created ?? []) {
        existingByLowerName.set(company.name.trim().toLowerCase(), company.id);
      }
    }

    const payloads = validRows.map((r) => ({
      organization_id: organizationId,
      name: r.values.name,
      email: r.values.email || null,
      phone: r.values.phone || null,
      job_title: r.values.job_title || null,
      status: r.values.status || "new",
      priority: r.values.priority || null,
      company_id: r.values.company ? (existingByLowerName.get(r.values.company.toLowerCase()) ?? null) : null,
    }));

    const CHUNK_SIZE = 100;
    let imported = 0;
    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
      const chunk = payloads.slice(i, i + CHUNK_SIZE);
      const { error, count } = await supabase
        .from("contacts")
        .insert(chunk, { count: "exact" });
      if (error) {
        toast.error(`Import stopped: ${error.message}`);
        break;
      }
      imported += count ?? chunk.length;
    }

    setResult({ imported, skipped: invalidRows.length });
    setStep("done");
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Upload /> Import CSV
      </Button>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import contacts from CSV</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Upload a CSV file. The first row must be a header row. You&apos;ll
              map columns to fields on the next step, and up to {MAX_ROWS} rows
              per file.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button type="button" onClick={() => fileInputRef.current?.click()}>
              Choose file...
            </Button>
          </div>
        )}

        {step === "mapping" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Map columns</p>
              <div className="grid grid-cols-2 gap-3">
                {headers.map((header) => (
                  <div key={header} className="grid gap-1">
                    <label className="truncate text-xs text-muted-foreground" title={header}>
                      {header}
                    </label>
                    <Select
                      value={mapping[header] ?? ""}
                      onChange={(e) =>
                        setMapping((prev) => ({
                          ...prev,
                          [header]: e.target.value as TargetField,
                        }))
                      }
                    >
                      {TARGET_FIELDS.map((field) => (
                        <option key={field.value} value={field.value}>
                          {field.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="text-foreground">
                {validRows.length} of {parsedRows.length} rows are ready to import.
              </p>
              {invalidRows.length > 0 && (
                <p className="mt-1 text-muted-foreground">
                  {invalidRows.length} row{invalidRows.length === 1 ? "" : "s"} will be
                  skipped. Most common issue:{" "}
                  {invalidRows[0]?.errors[0] ?? "unknown"}
                </p>
              )}
            </div>

            {invalidRows.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-2 py-1">Row</th>
                      <th className="px-2 py-1">Name</th>
                      <th className="px-2 py-1">Problem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.slice(0, 20).map((row) => (
                      <tr key={row.index} className="border-b border-border last:border-0">
                        <td className="px-2 py-1 text-muted-foreground">{row.index + 2}</td>
                        <td className="px-2 py-1 text-foreground">{row.values.name || "—"}</td>
                        <td className="px-2 py-1 text-danger">{row.errors.join(", ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {step === "importing" && (
          <p className="py-8 text-center text-sm text-muted-foreground">Importing...</p>
        )}

        {step === "done" && result && (
          <div className="flex flex-col gap-2 py-4 text-center">
            <p className="text-sm text-foreground">
              Imported {result.imported} contact{result.imported === 1 ? "" : "s"}.
            </p>
            {result.skipped > 0 && (
              <p className="text-sm text-muted-foreground">
                {result.skipped} row{result.skipped === 1 ? "" : "s"} skipped due to
                validation errors.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={reset}>
                Start over
              </Button>
              <Button onClick={handleImport} disabled={validRows.length === 0}>
                Import {validRows.length} contact{validRows.length === 1 ? "" : "s"}
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={() => setOpen(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
