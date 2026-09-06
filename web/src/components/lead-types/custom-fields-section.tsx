"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LeadTypeField } from "@/lib/lead-types";

export interface LeadTypeOption {
  id: string;
  name: string;
  fields: LeadTypeField[];
}

interface CustomFieldsSectionProps {
  leadTypes: LeadTypeOption[];
  leadTypeId: string;
  onLeadTypeChange: (id: string) => void;
  values: Record<string, unknown>;
  onValuesChange: (values: Record<string, unknown>) => void;
}

// The lead-type picker plus whatever fields that type defines. Shared by
// the create and edit contact dialogs so the two can't drift. Values are
// held as plain state by the parent rather than going through
// react-hook-form: the field set is only known at runtime, and a zod
// schema that has to be rebuilt per lead type buys nothing over the
// required-check done at save time here.
export function CustomFieldsSection({
  leadTypes,
  leadTypeId,
  onLeadTypeChange,
  values,
  onValuesChange,
}: CustomFieldsSectionProps) {
  const selected = leadTypes.find((t) => t.id === leadTypeId);

  const setValue = (key: string, value: unknown) => {
    onValuesChange({ ...values, [key]: value });
  };

  if (leadTypes.length === 0) return null;

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="lead_type_id">Lead type</Label>
        <Select
          id="lead_type_id"
          value={leadTypeId}
          onChange={(e) => {
            onLeadTypeChange(e.target.value);
            // Switching type clears the previous type's answers — keeping
            // them would leave values keyed to fields no longer on the
            // record, invisible in the UI but still in the database.
            onValuesChange({});
          }}
        >
          <option value="">No lead type</option>
          {leadTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
      </div>

      {selected && selected.fields.length > 0 && (
        <div className="rounded-lg bg-surface-2 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
            {selected.name} details
          </p>
          <div className="flex flex-col gap-4">
            {selected.fields.map((field) => {
              const inputId = `custom_${field.key}`;
              const raw = values[field.key];

              if (field.type === "checkbox") {
                return (
                  <label key={field.key} className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                      checked={raw === true}
                      onCheckedChange={(v) => setValue(field.key, v === true)}
                    />
                    {field.label}
                    {field.required && <span className="text-danger">*</span>}
                  </label>
                );
              }

              return (
                <div key={field.key} className="grid gap-2">
                  <Label htmlFor={inputId}>
                    {field.label}
                    {field.required && <span className="ml-0.5 text-danger">*</span>}
                  </Label>
                  {field.type === "select" ? (
                    <Select
                      id={inputId}
                      value={typeof raw === "string" ? raw : ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    >
                      <option value="">Select...</option>
                      {(field.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id={inputId}
                      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
                      value={typeof raw === "string" || typeof raw === "number" ? String(raw) : ""}
                      onChange={(e) => setValue(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

/** Returns the label of the first required field left empty, if any. */
export function findMissingRequiredField(
  leadType: LeadTypeOption | undefined,
  values: Record<string, unknown>,
): string | null {
  if (!leadType) return null;
  for (const field of leadType.fields) {
    if (!field.required) continue;
    const value = values[field.key];
    const empty = field.type === "checkbox" ? value !== true : value == null || value === "";
    if (empty) return field.label;
  }
  return null;
}
