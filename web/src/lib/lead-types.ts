// Shape and helpers for lead-type custom fields.
//
// lead_types.fields is jsonb with no CHECK constraint (see the migration's
// header note on why), so nothing guarantees its shape at the database
// layer. Every read goes through parseLeadTypeFields() rather than being
// cast, so a malformed or hand-edited row degrades to "no fields" instead
// of crashing a page.

export const LEAD_FIELD_TYPES = ["text", "number", "date", "select", "checkbox"] as const;

export type LeadFieldType = (typeof LEAD_FIELD_TYPES)[number];

export const LEAD_FIELD_TYPE_LABELS: Record<LeadFieldType, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  select: "Dropdown",
  checkbox: "Checkbox",
};

export interface LeadTypeField {
  /** Stable slug used as the key inside contacts.custom_fields. */
  key: string;
  label: string;
  type: LeadFieldType;
  /** Only meaningful for type "select". */
  options?: string[];
  required?: boolean;
}

/**
 * Derives the stable storage key from a field's label. Generated once when
 * the field is created and then never recomputed, renaming a field's
 * label must not orphan the values already stored under the old key.
 */
export function slugifyFieldKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isLeadFieldType(value: unknown): value is LeadFieldType {
  return typeof value === "string" && (LEAD_FIELD_TYPES as readonly string[]).includes(value);
}

/** Narrows raw jsonb into field definitions, dropping anything malformed. */
export function parseLeadTypeFields(raw: unknown): LeadTypeField[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null) return [];
    const record = entry as Record<string, unknown>;
    const key = record.key;
    const label = record.label;
    if (typeof key !== "string" || !key || typeof label !== "string" || !label) return [];

    const type = isLeadFieldType(record.type) ? record.type : "text";
    const options = Array.isArray(record.options)
      ? record.options.filter((o): o is string => typeof o === "string")
      : undefined;

    return [
      {
        key,
        label,
        type,
        ...(type === "select" && options ? { options } : {}),
        ...(record.required === true ? { required: true } : {}),
      },
    ];
  });
}

/** Reads one field's stored answer out of a contact's custom_fields blob. */
export function readCustomValue(
  customFields: Record<string, unknown> | null | undefined,
  field: LeadTypeField,
): string {
  const value = customFields?.[field.key];
  if (value == null || value === "") return "";
  if (field.type === "checkbox") return value === true || value === "true" ? "Yes" : "No";
  if (field.type === "date") {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  }
  return String(value);
}
