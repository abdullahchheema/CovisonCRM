import * as React from "react";

import { cn } from "@/lib/utils";

// A plain native <select>, styled to match Input/Button. The legacy app's
// Radix-based Select (with search, multi-select variants) is a later port —
// this is deliberately minimal, for the small fixed-option pickers (status,
// company) the first CRM forms need.
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-md border border-border bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
