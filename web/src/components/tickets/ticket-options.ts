// Values match backend/enums/enums.go exactly (the legacy app's single
// source of truth for these), so a ticket created here would round-trip
// through the old API's validation unchanged.
export const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical" },
  { value: "billing", label: "Billing" },
  { value: "general", label: "General" },
  { value: "featureRequest", label: "Feature request" },
  { value: "bug", label: "Bug" },
  { value: "other", label: "Other" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "inProgress", label: "In progress" },
  { value: "onHold", label: "On hold" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
);
export const PRIORITY_LABELS: Record<string, string> = Object.fromEntries(
  PRIORITY_OPTIONS.map((o) => [o.value, o.label]),
);
export const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label]),
);

// Shared between tickets-table.tsx and the ticket detail page, a
// status/priority's job is state, not identity, so it maps to the
// semantic Badge colors, not a categorical palette.
export const PRIORITY_VARIANT: Record<string, "neutral" | "info" | "warning" | "danger"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  critical: "danger",
};

export const STATUS_VARIANT: Record<string, "info" | "brand" | "warning" | "success" | "neutral"> = {
  open: "info",
  inProgress: "brand",
  onHold: "warning",
  resolved: "success",
  closed: "neutral",
};
