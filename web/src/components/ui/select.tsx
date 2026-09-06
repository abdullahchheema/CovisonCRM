import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

// A plain native <select>, restyled with appearance-none + a custom
// chevron so it matches Input visually instead of rendering the browser's
// default control. Deliberately still a native element, not a Radix
// Select, see the file-level note in the design plan on why that
// migration is a separate follow-up (every call site binds it via
// react-hook-form's {...register()}, which a Radix Select can't do
// without a <Controller> at every one of ~30 sites).
const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none rounded-md border border-border bg-surface px-3 py-1 pr-8 text-sm shadow-xs transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-text-2"
    />
  </div>
));
Select.displayName = "Select";

export { Select };
