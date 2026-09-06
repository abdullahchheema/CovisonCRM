"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import {
  LEAD_FIELD_TYPES,
  LEAD_FIELD_TYPE_LABELS,
  slugifyFieldKey,
  type LeadFieldType,
  type LeadTypeField,
} from "@/lib/lead-types";

interface LeadTypeFormDialogProps {
  organizationId: string;
  leadType?: {
    id: string;
    name: string;
    description: string | null;
    fields: LeadTypeField[];
  };
  nextPosition?: number;
  trigger: React.ReactNode;
}

// A draft field carries its committed storage key separately from its
// label. Renaming a label must not change the key, the answers already
// stored in contacts.custom_fields are keyed by it, and rewriting that key
// would orphan every existing value. `key: null` means "not yet saved", so
// the key gets derived from the label at save time.
interface DraftField extends Omit<LeadTypeField, "key"> {
  key: string | null;
}

function toDraft(fields: LeadTypeField[]): DraftField[] {
  return fields.map((f) => ({ ...f }));
}

export function LeadTypeFormDialog({
  organizationId,
  leadType,
  nextPosition = 0,
  trigger,
}: LeadTypeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(leadType?.name ?? "");
  const [description, setDescription] = useState(leadType?.description ?? "");
  const [fields, setFields] = useState<DraftField[]>(toDraft(leadType?.fields ?? []));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const reset = () => {
    setName(leadType?.name ?? "");
    setDescription(leadType?.description ?? "");
    setFields(toDraft(leadType?.fields ?? []));
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const addField = () => {
    setFields((prev) => [...prev, { key: null, label: "", type: "text" }]);
  };

  const updateField = (index: number, patch: Partial<DraftField>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this lead type a name.");
      return;
    }
    if (fields.some((f) => !f.label.trim())) {
      setError("Every field needs a label.");
      return;
    }

    // Resolve storage keys: existing fields keep theirs, new ones derive
    // from the label, and collisions get a numeric suffix so two fields
    // labelled the same never overwrite each other's values.
    const usedKeys = new Set<string>();
    const resolved: LeadTypeField[] = [];
    for (const field of fields) {
      let key = field.key ?? slugifyFieldKey(field.label);
      if (!key) key = "field";
      if (usedKeys.has(key)) {
        let suffix = 2;
        while (usedKeys.has(`${key}_${suffix}`)) suffix += 1;
        key = `${key}_${suffix}`;
      }
      usedKeys.add(key);

      const options =
        field.type === "select"
          ? (field.options ?? []).map((o) => o.trim()).filter(Boolean)
          : undefined;

      resolved.push({
        key,
        label: field.label.trim(),
        type: field.type,
        ...(options && options.length > 0 ? { options } : {}),
        ...(field.required ? { required: true } : {}),
      });
    }

    if (resolved.some((f) => f.type === "select" && (f.options ?? []).length === 0)) {
      setError("Dropdown fields need at least one option.");
      return;
    }

    setIsSaving(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      name: trimmedName,
      description: description.trim() || null,
      fields: resolved as unknown as Record<string, unknown>[],
    };

    const { error: saveError } = leadType
      ? await supabase.from("lead_types").update(payload).eq("id", leadType.id)
      : await supabase
          .from("lead_types")
          .insert({ ...payload, organization_id: organizationId, position: nextPosition });

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    toast.success(leadType ? "Lead type updated" : "Lead type created");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{leadType ? "Edit lead type" : "New lead type"}</DialogTitle>
          <DialogDescription>
            Fields you add here appear on every contact of this type, on top
            of the standard contact details.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lead-type-name">Name</Label>
            <Input
              id="lead-type-name"
              placeholder="Truck dispatching"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lead-type-description">Description</Label>
            <Input
              id="lead-type-description"
              placeholder="Optional, what this type is for"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-lg bg-surface-2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-text-2">Fields</p>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus /> Add field
            </Button>
          </div>

          {fields.length === 0 ? (
            <p className="py-2 text-sm text-text-3">
              No extra fields yet, contacts of this type will just show the
              standard details.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {fields.map((field, index) => (
                <div key={index} className="rounded-md bg-surface p-3 shadow-xs">
                  <div className="flex items-start gap-2">
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Field label (e.g. MC number)"
                        value={field.label}
                        onChange={(e) => updateField(index, { label: e.target.value })}
                        aria-label={`Field ${index + 1} label`}
                      />
                      <Select
                        value={field.type}
                        onChange={(e) =>
                          updateField(index, { type: e.target.value as LeadFieldType })
                        }
                        aria-label={`Field ${index + 1} type`}
                      >
                        {LEAD_FIELD_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {LEAD_FIELD_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 pt-2">
                      <button
                        type="button"
                        onClick={() => moveField(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move field ${index + 1} up`}
                        className="text-text-3 hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveField(index, 1)}
                        disabled={index === fields.length - 1}
                        aria-label={`Move field ${index + 1} down`}
                        className="text-text-3 hover:text-foreground disabled:opacity-30"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        aria-label={`Remove field ${index + 1}`}
                        className="text-text-3 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {field.type === "select" && (
                    <div className="mt-2">
                      <Input
                        placeholder="Options, comma separated (e.g. Dry van, Reefer, Flatbed)"
                        value={(field.options ?? []).join(", ")}
                        onChange={(e) =>
                          updateField(index, { options: e.target.value.split(",") })
                        }
                        aria-label={`Field ${index + 1} options`}
                      />
                    </div>
                  )}

                  <label className="mt-2 flex items-center gap-2 text-xs text-text-2">
                    <Checkbox
                      checked={field.required === true}
                      onCheckedChange={(v) => updateField(index, { required: v === true })}
                    />
                    Required
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : leadType ? "Save changes" : "Create lead type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
