import * as React from "react";

import { cn } from "@/lib/utils";

// Extracted from the hand-rolled textarea markup duplicated in
// add-note-form and 6 form dialogs.
const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-xs transition-[border-color,box-shadow] placeholder:text-text-3 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export { Textarea };
