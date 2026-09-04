import * as Yup from "yup";

export const emptyTask = {
  title: "",
  description: "",
  author: { name: "", image: "/static/avatar/001-man.svg" },
  label: "",
  labelColor: "primary",
  priority: "",
  dueDate: "",
  estimatedDuration: "",
};

/**
 * Niche-agnostic label palette. Each entry maps to a CustomBadge variant so
 * card tags stay visually consistent with badges used across the app, plus the
 * tokens needed to tint the card's accent border for the chosen color.
 */
export const LABEL_COLORS = [
  { value: "primary", dot: "bg-primary", accent: "border-l-primary" },
  { value: "blue", dot: "bg-blue-500", accent: "border-l-blue-500" },
  { value: "success", dot: "bg-green-500", accent: "border-l-green-500" },
  { value: "warning", dot: "bg-amber-500", accent: "border-l-amber-500" },
  { value: "danger", dot: "bg-red-500", accent: "border-l-red-500" },
  { value: "violet", dot: "bg-violet-500", accent: "border-l-violet-500" },
  { value: "sky", dot: "bg-sky-500", accent: "border-l-sky-500" },
  { value: "orange", dot: "bg-orange-500", accent: "border-l-orange-500" },
  { value: "teal", dot: "bg-teal-500", accent: "border-l-teal-500" },
  { value: "neutral", dot: "bg-muted-foreground", accent: "border-l-border" },
] as const;

export const accentForColor = (color?: string) =>
  LABEL_COLORS.find((c) => c.value === color)?.accent ?? "border-l-transparent";

export const dotForColor = (color?: string) =>
  LABEL_COLORS.find((c) => c.value === color)?.dot ?? "bg-primary";

export const emptyColumn = { name: "" };

export const columnValidationSchema = Yup.object({
  name: Yup.string().min(2, "Too short").required("Required"),
});
