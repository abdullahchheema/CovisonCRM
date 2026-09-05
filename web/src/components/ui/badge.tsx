import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Replaces the 9 near-duplicate grey-pill className strings scattered
// across contacts-table, companies-table, contacts/[id], team, and
// member-row. Uses the semantic colors (success/warning/danger/info) that
// were defined in globals.css but never actually used anywhere in the app.
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        // bg-muted (--surface-2) is too close to the page background
        // (--bg) in light mode to read as a pill at all — surface-3 is a
        // more distinct step, verified visually in both themes.
        neutral: "bg-surface-3 text-text-2",
        brand: "bg-brand-soft text-primary",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        info: "bg-info-soft text-info",
        outline: "border border-border text-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
