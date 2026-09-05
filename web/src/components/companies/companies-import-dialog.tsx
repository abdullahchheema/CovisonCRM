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

// Same 1000-row ceiling as the contacts importer — see that file's comment
// for why (the legacy app's CSV import had no size limit at all).
const MAX_ROWS = 1000;

const TARGET_FIELDS = [
  { value: "", label: "Ignore this column" },
  { value: "name", label: "Name (required)" },
  { value: "domain", label: "Domain" },
  { value: "website", label: "Website" },
  { value: "phone", label: "Phone" },
  { value: "industry", label: "Industry" },
] as const;

type TargetField = (typeof TARGET_FIELDS)[number]["value"];

interface ParsedRow {
  index: number;
  values: Record<TargetField, string>;
  errors: string[];
}

interface CompaniesImportDialogProps {
  organizationId: string;
}

function guessMapping(header: string): TargetField {
  const normalized = header.trim().toLowerCase();
  const match = TARGET_FIELDS.find(
    (f) => f.value && normalized.replace(/[\s_]/g, "") === f.value.replace(/_/g, ""),
  );
  if (match) return match.value;
  if (normalized.includes("domain")) return "domain";
  if (normalized.includes("website") || normalized.includes("url")) return "website";
  if (normalized.includes("phone")) return "phone";
  if (normalized.includes("industry") || normalized.includes("sector")) return "industry";
  if (normalized.includes("name") || normalized.includes("company")) return "name";
  return "";
}

export function CompaniesImportDialog({ organizationId }: CompaniesImportDialogProps) {
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

      return { index, values, errors };
    });
  };

  const parsedRows = step === "mapping" || step === "importing" ? buildParsedRows() : [];
  const validRows = parsedRows.filter((r) => r.errors.length === 0);
  const invalidRows = parsedRows.filter((r) => r.errors.length > 0);

  const handleImport = async () => {
    setStep("importing");
    const supabase = createClient();

    const payloads = validRows.map((r) => ({
      organization_id: organizationId,
      name: r.values.name,
      domain: r.values.domain || null,
      website: r.values.website || null,
      phone: r.values.phone || null,
      industry: r.values.industry || null,
    }));

    const CHUNK_SIZE = 100;
    let imported = 0;
    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
      const chunk = payloads.slice(i, i + CHUNK_SIZE);
      const { error, count } = await supabase
        .from("companies")
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
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Upload /> Import CSV
      </Button>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import companies from CSV</DialogTitle>
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
                  skipped — missing a name.
                </p>
              )}
            </div>
          </div>
        )}

        {step === "importing" && (
          <p className="py-8 text-center text-sm text-muted-foreground">Importing...</p>
        )}

        {step === "done" && result && (
          <div className="flex flex-col gap-2 py-4 text-center">
            <p className="text-sm text-foreground">
              Imported {result.imported} compan{result.imported === 1 ? "y" : "ies"}.
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
                Import {validRows.length} compan{validRows.length === 1 ? "y" : "ies"}
              </Button>
            </>
          )}
          {step === "done" && <Button onClick={() => setOpen(false)}>Close</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
